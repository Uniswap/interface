import * as Sentry from '@sentry/react'
import { Span, SpanStatusType } from '@sentry/tracing'

interface TraceMetadata {
  /** Arbitrary data stored on a trace. */
  data?: Record<string, unknown>
  /** Indexed (ie searchable) tags associated with a trace. */
  tags?: Record<string, string | number | boolean>
}

// These methods are provided as an abstraction so that users will not interact with Sentry directly.
// This avoids tightly coupling Sentry to our instrumentation outside of this file, in case we swap services.
interface TraceCallbackOptions {
  traceChild<T>(name: string, callback: TraceCallback<T>, metadata?: TraceMetadata): Promise<T>
  setTraceData(key: string, value: unknown): void
  setTraceTag(key: string, value: string | number | boolean): void
  setTraceStatus(status: number | SpanStatusType): void
  setTraceError(error: unknown): void
}
type TraceCallback<T> = (options: TraceCallbackOptions) => Promise<T>

function traceTransaction(transaction?: Span) {
  const traceChild = <T>(name: string, callback: TraceCallback<T>, metadata?: TraceMetadata) => {
    const child = transaction?.startChild({ ...metadata, op: name })
    return traceTransaction(child)(name, callback)
  }
  const setTraceData = (key: string, value: unknown) => void transaction?.setData(key, value)
  const setTraceTag = (key: string, value: string | number | boolean) => void transaction?.setTag(key, value)
  const setTraceStatus = (status: number | SpanStatusType) => {
    if (typeof status === 'number') {
      transaction?.setHttpStatus(status)
    } else {
      transaction?.setStatus(status)
    }
  }
  const setTraceError = (error: unknown) => void transaction?.setData('error', error)

  return async function boundTrace<T>(name: string, callback: TraceCallback<T>): Promise<T> {
    try {
      return await callback({ traceChild, setTraceData, setTraceTag, setTraceStatus, setTraceError })
    } catch (error) {
      // Do not overwrite any custom status or error data that was already set.
      if (!transaction?.status) transaction?.setStatus('internal_error')
      if (!transaction?.data.error) transaction?.setData('error', error)

      throw error
    } finally {
      // If no status was reported, assume that it was 'ok'. Otherwise, it will default to 'unknown'.
      if (!transaction?.status) transaction?.setStatus('ok')
      transaction?.finish()
    }
  }
}

/** Traces the callback, adding any metadata to the trace. */
export async function trace<T>(name: string, callback: TraceCallback<T>, metadata?: TraceMetadata): Promise<T> {
  const transaction = Sentry.startTransaction({ name, data: metadata?.data, tags: metadata?.tags })
  return traceTransaction(transaction)(name, callback)
}
