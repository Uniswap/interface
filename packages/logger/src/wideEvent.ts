/**
 * Wide Event
 *
 * Canonical log line pattern: accumulate fields throughout a request lifecycle,
 * then emit one structured log line at completion.
 *
 * Goal: one log line per request with enough context to diagnose any error
 * without cross-referencing other logs.
 */

import type { Logger } from './types'

/** Where the error originated — for Datadog faceting/alerting */
export type ErrorSource = 'trpc_procedure' | 'loader' | 'upstream_5xx' | 'unhandled'

/** Recursive error shape that preserves cause chains */
export interface SerializedError {
  class: string
  message: string
  stack?: string
  code?: string
  cause?: SerializedError
}

/**
 * Recursively serialize an error, walking the .cause chain.
 * Pure function — no side effects, no implicit deps.
 */
export function serializeErrorForWideEvent(err: unknown, depth = 0): SerializedError {
  // Guard against infinite/absurd cause chains
  if (depth > 5) {
    return { class: 'TruncatedCauseChain', message: '(cause chain exceeded 5 levels)' }
  }

  if (err instanceof Error) {
    return {
      class: err.constructor.name,
      message: err.message,
      stack: err.stack,
      ...('code' in err && err.code ? { code: String(err.code) } : {}),
      ...(err.cause ? { cause: serializeErrorForWideEvent(err.cause, depth + 1) } : {}),
    }
  }

  // Handle Response objects (e.g., React Router throws these for unmatched routes)
  if (typeof Response !== 'undefined' && err instanceof Response) {
    return {
      class: 'Response',
      message: `HTTP ${err.status} ${err.statusText || '(no status text)'}`,
      code: String(err.status),
    }
  }

  // Handle plain objects — JSON.stringify to preserve useful information
  if (typeof err === 'object' && err !== null) {
    try {
      const json = JSON.stringify(err)
      // oxlint-disable-next-line typescript/no-unnecessary-condition
      return { class: err.constructor?.name ?? 'Object', message: json.length > 2000 ? json.slice(0, 2000) : json }
    } catch {
      return { class: 'Object', message: '(unserializable object)' }
    }
  }

  if (err !== undefined && err !== null) {
    return { class: typeof err, message: String(err) }
  }

  return { class: 'Unknown', message: '(no error value)' }
}

export interface WideEvent {
  /** Add fields that accumulate through the request lifecycle */
  add(fields: Record<string, unknown>): void
  /** Record a procedure span (name, duration, outcome) */
  addProcedure(span: { name: string; duration_ms: number; outcome: 'success' | 'error'; error_code?: string }): void
  /** Capture a fully serialized error with cause chain + source classification */
  addError(error: unknown, source?: ErrorSource): void
  /** Flush the canonical log line at request completion */
  flush(logger: Logger, outcome: 'success' | 'error'): void
}

export interface WideEventFactory {
  create(req: Request): WideEvent
}

/**
 * Create a wide event for a request.
 * Does NOT generate its own trace_id — relies on the logger's child context
 * for trace correlation (single source of truth for trace_id).
 */
export function createWideEvent(req: Request): WideEvent {
  const url = new URL(req.url)
  const method = req.method
  const path = url.pathname
  const start_time = Date.now()

  const fields: Record<string, unknown> = {}
  const procedures: Array<{ name: string; duration_ms: number; outcome: 'success' | 'error'; error_code?: string }> = []
  let capturedError: SerializedError | undefined
  let errorSource: ErrorSource | undefined

  return {
    add(newFields: Record<string, unknown>): void {
      Object.assign(fields, newFields)
    },

    addProcedure(span): void {
      procedures.push(span)
    },

    addError(error: unknown, source?: ErrorSource): void {
      capturedError = serializeErrorForWideEvent(error)
      if (source) {
        errorSource = source
      }
    },

    flush(logger: Logger, outcome: 'success' | 'error'): void {
      const duration_ms = Date.now() - start_time
      const payload = {
        method,
        path,
        outcome,
        duration_ms,
        ...(procedures.length > 0 ? { procedures } : {}),
        ...(capturedError && outcome === 'error' ? { error: capturedError } : {}),
        ...(errorSource && outcome === 'error' ? { error_source: errorSource } : {}),
        ...fields,
      }

      // Flush at the right log level so Datadog can index/alert on severity.
      // Error details are already in payload.error (pre-serialized) — don't pass
      // as the error param to avoid double-serialization by the structured logger.
      if (outcome === 'error') {
        logger.error('request.complete', undefined, payload)
      } else {
        logger.info('request.complete', payload)
      }
    },
  }
}

export const wideEventFactory: WideEventFactory = {
  create(req: Request): WideEvent {
    return createWideEvent(req)
  },
}
