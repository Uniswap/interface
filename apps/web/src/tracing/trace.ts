import 'zone.js'

import { TraceContext } from 'tracing/types'

// @ts-ignore Avoid logging unhandled errors - they're already logged by the browser and Sentry.
Zone[Zone.__symbol__('ignoreConsoleErrorUncaughtError')] = true

declare global {
  interface Zone {
    get(key: 'trace'): TraceCallbackContext['child'] | undefined
  }
}

// Provides performance and timing related methods to trace callbacks.
interface TraceCallbackContext {
  /** Traces the callback as a child of the active trace. */
  child<T>(context: TraceContext, callback: TraceCallback<T>): Promise<T>

  /** The elapsed time (in ms) since this trace was started. This mirrors `performance.now()`. */
  now(): number
}
type TraceCallback<T> = (options: TraceCallbackContext) => Promise<T>

async function datadogAdaptor<T>(context: TraceContext, callback: TraceCallback<T>): Promise<T> {
  const start = performance.now()
  const callbackContext: TraceCallbackContext = {
    child(context, callback) {
      return datadogAdaptor(context, callback)
    },
    now() {
      return performance.now() - start
    },
  }
  try {
    return await callback(callbackContext)
  } finally {
    // Do not measure http ops, as they are already measured by DevTools as network calls.
    if (!context.op.startsWith('http')) {
      performance.measure(context.op, { start })
    }
  }
}

/** Traces the callback. */
export async function trace<T>(context: TraceContext, callback: TraceCallback<T>): Promise<T> {
  const parentTrace = Zone.current.get('trace')
  if (parentTrace) {
    return parentTrace?.(context, callback)
  } else {
    return datadogAdaptor(context, callback)
  }
}
