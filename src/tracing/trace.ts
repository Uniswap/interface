import * as Sentry from '@sentry/react'
import { Span, SpanStatusType } from '@sentry/tracing'

type TraceTags = {
  is_widget: boolean
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
  /**
   * Traces the callback as a child of the active trace.
   * @param name - The name of the child. (On Sentry, this will appear as the "op".)
   * @param callback - The callback to trace. The child trace will run for the duration of the callback.
   * @param metadata - Any data or tags to include in the child trace.
   */
  traceChild<T>(name: string, callback: TraceCallback<T>, metadata?: TraceMetadata): Promise<T>
  setTraceData(key: string, value: unknown): void
  setTraceTag<K extends keyof TraceTags>(key: K, value: TraceTags[K]): void
  /**
   * Sets the status of a trace. If unset, the status will be set to 'ok' (or 'internal_error' if the callback throws).
   * @param status - If a number is passed, the corresponding http status will be used.
   */
  setTraceStatus(status: number | SpanStatusType): void
  /** Sets the error data of a trace. If unset and the callback throws, the thrown error will be set. */
  setTraceError(error: unknown): void
}
type TraceCallback<T> = (options: TraceCallbackOptions) => Promise<T>

/**
 * Sets up TraceCallbackOptions for a Span (NB: Transaction extends Span).
 * @returns a handler which will run a TraceCallback and propagate its result.
 */
function traceSpan(span?: Span) {
  const traceChild = <T>(name: string, callback: TraceCallback<T>, metadata?: TraceMetadata) => {
    const child = span?.startChild({ ...metadata, op: name })
    return traceSpan(child)(callback)
  }
  const setTraceData = <K extends keyof TraceTags>(key: K, value: TraceTags[K]) => {
    span?.setData(key, value)
  }
  const setTraceTag = (key: string, value: string | number | boolean) => {
    span?.setTag(key, value)
  }
  const setTraceStatus = (status: number | SpanStatusType) => {
    if (typeof status === 'number') {
      span?.setHttpStatus(status)
    } else {
      span?.setStatus(status)
    }
  }
  const setTraceError = (error: unknown) => {
    span?.setData('error', error)
  }

  return async function boundTrace<T>(callback: TraceCallback<T>): Promise<T> {
    try {
      return await callback({ traceChild, setTraceData, setTraceTag, setTraceStatus, setTraceError })
    } catch (error) {
      // Do not overwrite any custom status or error data that was already set.
      if (!span?.status) span?.setStatus('internal_error')
      if (!span?.data.error) span?.setData('error', error)

      throw error
    } finally {
      // If no status was reported, assume that it was 'ok'. Otherwise, it will default to 'unknown'.
      if (!span?.status) span?.setStatus('ok')
      span?.finish()
    }
  }
}

/**
 * Traces the callback, adding any metadata to the trace.
 * @param name - The name of your trace.
 * @param callback - The callback to trace. The trace will run for the duration of the callback.
 * @param metadata - Any data or tags to include in the trace.
 */
export async function trace<T>(name: string, callback: TraceCallback<T>, metadata?: TraceMetadata): Promise<T> {
  const transaction = Sentry.startTransaction({ name, data: metadata?.data, tags: metadata?.tags })
  return traceSpan(transaction)(callback)
}
