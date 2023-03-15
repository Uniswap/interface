import * as Sentry from '@sentry/react'
import { Span, SpanStatusType } from '@sentry/tracing'

type TraceTags = {
  widget: boolean
}

interface TraceMetadata {
  /** Arbitrary data stored on a trace. */
  data?: Record<string, unknown>
  /** Indexed (ie searchable) tags associated with a trace. */
  tags?: Partial<TraceTags>
}

// These methods are provided as an abstraction so that users will not interact with Sentry directly.
// This avoids tightly coupling Sentry to our instrumentation outside of this file, in case we swap services.
interface TraceCallbackOptions {
  traceChild<T>(name: string, callback: TraceCallback<T>, metadata?: TraceMetadata): Promise<T>
  setTraceData(key: string, value: unknown): void
  setTraceTag<K extends keyof TraceTags>(key: K, value: TraceTags[K]): void
  setTraceStatus(status: number | SpanStatusType): void
  setTraceError(error: unknown): void
}
type TraceCallback<T> = (options: TraceCallbackOptions) => Promise<T>

/**
 * Sets up TraceCallbackOptions for a transaction.
 * @returns a handler which will run a TraceCallback and propagate its result.
 */
function traceTransaction(transaction?: Span) {
  const traceChild = <T>(name: string, callback: TraceCallback<T>, metadata?: TraceMetadata) => {
    const child = transaction?.startChild({ ...metadata, op: name })
    return traceTransaction(child)(callback)
  }
  const setTraceData = <K extends keyof TraceTags>(key: K, value: TraceTags[K]) => {
    transaction?.setData(key, value)
  }
  const setTraceTag = (key: string, value: string | number | boolean) => {
    transaction?.setTag(key, value)
  }
  const setTraceStatus = (status: number | SpanStatusType) => {
    if (typeof status === 'number') {
      transaction?.setHttpStatus(status)
    } else {
      transaction?.setStatus(status)
    }
  }
  const setTraceError = (error: unknown) => {
    transaction?.setData('error', error)
  }

  return async function boundTrace<T>(callback: TraceCallback<T>): Promise<T> {
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
  return traceTransaction(transaction)(callback)
}
