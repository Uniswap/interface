import 'zone.js'

import { SpanStatusType } from '@sentry/core'
import * as Sentry from '@sentry/react'
import { Span, TransactionContext } from '@sentry/types'
import { TraceContext } from './types'

// @ts-ignore Avoid logging unhandled errors - they're already logged by the browser and Sentry.
Zone[Zone.__symbol__('ignoreConsoleErrorUncaughtError')] = true

declare global {
  interface Zone {
    get(key: 'trace'): TraceCallbackContext['child'] | undefined
  }
}

// These methods are provided as an abstraction so that users will not interact with Sentry directly.
// This avoids tightly coupling Sentry to our tracing service outside of this file, in case we swap services.
interface TraceCallbackContext {
  /** Traces the callback as a child of the active trace. */
  child<T>(context: TraceContext, callback: TraceCallback<T>): Promise<T>

  /**
   * Sets arbitrary data on the active trace.
   * Multiple keys may be set separately, eg `setData('key', data); setData('key.nested', otherData)`.
   */
  setData(key: string, value: unknown): void
  /**
   * Sets the status of a trace. If unset, the status will be set to 'ok' (or 'internal_error' if the callback throws).
   * @param status - If a number is passed, the corresponding http status will be used.
   */
  setStatus(status: number | SpanStatusType): void
  /**
   * Sets the error data of a trace.
   * If unset and the callback throws, the thrown error will automatically be set for the trace.
   */
  setError(error: unknown, status?: number | SpanStatusType): void

  /** The elapsed time (in ms) since this trace was started. This mirrors `performance.now()`. */
  now(): number
}
type TraceCallback<T> = (options: TraceCallbackContext) => Promise<T>

async function sentryAdaptor<T>(context: TraceContext, callback: TraceCallback<T>, span: Span | undefined): Promise<T> {
  const start = performance.now()
  const callbackContext: TraceCallbackContext = {
    child(context, callback) {
      const { name, op, tags, data } = context
      return sentryAdaptor(context, callback, span?.startChild({ description: name, op, tags, data }))
    },
    setData(key, value) {
      span?.setData(key, value)
    },
    setStatus(status) {
      if (typeof status === 'number') {
        span?.setHttpStatus(status)
      } else {
        span?.setStatus(status)
      }
    },
    setError(error, status = 'unknown_error') {
      callbackContext.setStatus(status)
      span?.setData('error', error)
    },
    now() {
      return performance.now() - start
    },
  }
  try {
    if (span) {
      const name = span.description ?? span.spanId // human-readable
      // Using trace-scoped zones allows child traces from async sources - like those defined in ./request.ts - to be
      // ascribed to the correct parent.
      return await Zone.current
        .fork({ name, properties: { trace: callbackContext.child } })
        .run(() => callback(callbackContext))
    } else {
      return await callback(callbackContext)
    }
  } catch (error) {
    // Do not overwrite any custom status or error data that is already set.
    if (!span?.status) span?.setStatus('unknown_error')
    if (!span?.data.error) span?.setData('error', error)

    throw error
  } finally {
    // Do not measure http ops, as they are already measured by DevTools as network calls.
    if (!context.op.startsWith('http')) performance.measure(context.op, { start })
    if (!span?.status) span?.setStatus('ok')
    span?.finish()
  }
}

/** Traces the callback. */
export async function trace<T>(context: TraceContext, callback: TraceCallback<T>): Promise<T> {
  const { name, op, tags, data } = context
  const sentryContext: TransactionContext = { name, description: name, op, tags, data }
  // We use inactive spans so that we can measure two distinct flows at once, without mingling them.
  const span = Sentry.startInactiveSpan(sentryContext)
  return sentryAdaptor(context, callback, span)
}
