import { SessionReadyTimeoutError, SessionRecoveryFailedError } from '@universe/sessions/src/session-gate/errors'
import type { Session } from '@universe/sessions/src/session-gate/types'
import type { Logger } from 'utilities/src/logger/logger'

interface GatedOptions<T> {
  session: Session
  call: () => Promise<T>
  /** Classifier for thrown errors (e.g. ConnectError code === Unauthenticated). */
  isUnauthError?: (err: unknown) => boolean
  /**
   * Classifier for resolved results (e.g. Response.status === 401).
   * Used by fetch-shaped wrappers where 401 doesn't throw.
   */
  isUnauthResult?: (result: T) => boolean
  /** Identifier for telemetry, e.g. `unirpc-viem`, `connect-rpc`. */
  source: string
  getLogger?: () => Logger
}

/**
 * The shared gate policy. Awaits ready → calls → on classified-401: recover →
 * retries once. Throws on persistent failure (or returns the persistent
 * unauthorized result if `isUnauthResult` matched the retry).
 *
 * Emits structured `SessionGate.*` events to the injected logger:
 * `ready.timeout`, `ready.failure`, `recover.start`, `recover.failure`,
 * `retry.success`, `retry.failure`. All include `tags.source`.
 *
 * Sensitive error fields (request body, response body) are not logged —
 * only `error.message` and `error.name` make it into `extra`.
 */
export async function gated<T>({
  session,
  call,
  isUnauthError,
  isUnauthResult,
  source,
  getLogger,
}: GatedOptions<T>): Promise<T> {
  const emit = (e: { level: 'info' | 'warn'; event: GateEvent; extra?: Record<string, unknown> }): void => {
    getLogger?.()[e.level]('SessionGate', e.event, EVENTS[e.event], { tags: { source }, extra: e.extra })
  }

  try {
    await session.ready()
  } catch (err) {
    if (err instanceof SessionReadyTimeoutError) {
      emit({ level: 'warn', event: 'ready.timeout', extra: { timeoutMs: err.timeoutMs } })
    } else {
      emit({ level: 'warn', event: 'ready.failure', extra: errorExtra(err) })
    }
    throw err
  }

  let firstFailure: unknown
  try {
    const result = await call()
    if (isUnauthResult?.(result)) {
      firstFailure = result
    } else {
      return result
    }
  } catch (err) {
    if (!isUnauthError?.(err)) throw err
    firstFailure = err
  }

  emit({ level: 'info', event: 'recover.start' })
  try {
    await session.recover()
  } catch (recoveryError) {
    emit({ level: 'warn', event: 'recover.failure', extra: errorExtra(recoveryError) })
    throw new SessionRecoveryFailedError(firstFailure, recoveryError)
  }

  try {
    const result = await call()
    if (isUnauthResult?.(result)) {
      emit({ level: 'warn', event: 'retry.failure', extra: resultExtra(result) })
      return result
    }
    emit({ level: 'info', event: 'retry.success' })
    return result
  } catch (retryError) {
    emit({ level: 'warn', event: 'retry.failure', extra: errorExtra(retryError) })
    throw retryError
  }
}

const EVENTS = {
  'ready.timeout': 'Session ready timed out',
  'ready.failure': 'Session init failed',
  'recover.start': 'Session recovery started',
  'recover.failure': 'Session recovery failed',
  'retry.success': 'Session-gated retry succeeded',
  'retry.failure': 'Session-gated retry still failed',
} as const

type GateEvent = keyof typeof EVENTS

/** Extract safe fields from an unknown error — never log the raw object. */
function errorExtra(err: unknown): { errorName: string; errorMessage: string; status?: number } {
  if (err instanceof Error) {
    const status = (err as Error & { status?: number }).status
    return {
      errorName: err.name,
      errorMessage: err.message,
      ...(typeof status === 'number' ? { status } : {}),
    }
  }
  return { errorName: 'NonError', errorMessage: String(err) }
}

/** Extract status from a Response-shaped result. */
function resultExtra(result: unknown): { status?: number } {
  if (result && typeof result === 'object' && 'status' in result && typeof result.status === 'number') {
    return { status: result.status }
  }
  return {}
}
