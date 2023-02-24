import { log as logInternal, logCallback, LoggingData, measureCallback, squelch } from './measure'
import { send } from './service'

export interface LoggingOptions<T> {
  /**
   * {@link LoggingData} to include with the timing. This will be passed to the server as-is, and must be serializable.
   * If the data must be derived from the callback result, it should be returned from {@link onResult} instead.
   */
  data?: LoggingData
  /** Returns data to include with the timing. This will be passed to the server as-is, and must be serializable. */
  onResult?: (result: T, data?: LoggingData) => LoggingData
  /** If true, the timing's descendants will not be logged. */
  squelch?: boolean
  /** If true, the timing (and its descendants) will be logged to the console. */
  debug?: boolean
}

/** Logs a timestamp. It will also be included in any logged timings. */
export function log(name: string, data?: LoggingData, error?: string) {
  const log = logInternal(name, data, error)
  send([log])
}

/** Marks a timestamp so that it is included in any logged timings. */
export function mark(name: string, data?: LoggingData, error?: string) {
  logInternal(name, data, error)
}

/** Logs a timing from a callback. */
export async function measure<T>(name: string, callback: () => Promise<T>, options?: LoggingOptions<T>): Promise<T> {
  return logCallback<T>(
    name,
    options?.squelch ? squelch(name, callback) : callback,
    (logs) => {
      if (options?.debug) {
        const measure = logs[logs.length - 1]
        console.groupCollapsed(`${measure.name} took ${measure.duration}ms`)
        console.table(logs, ['name', 'startTime', 'duration'])
        console.groupEnd()
      }
      send(logs)
    },
    options?.data,
    options?.onResult
  )
}

const windowFetch = window.fetch
/**
 * Logs a timing from a fetch.
 * @param onResponse - if not specified, marks 5xx status codes as errors ({@link errorOn5xx}).
 * @example
 * // Instead of fetch(url, options)
 * fetch('timing name', url, options)
 */
export async function fetch(
  name: string,
  input: RequestInfo,
  init?: RequestInit,
  onResponse: (response: Response) => LoggingData = errorOn5xx
): Promise<Response> {
  const url = typeof input === 'string' ? input : (input as Request).url
  return logCallback<Response>(name, () => windowFetch(input, init), send, { url }, onResponse)
}

/** Wraps a callback so that it is included in any logged timings. */
export function wrap<T>(name: string, callback: () => Promise<T>, options?: LoggingOptions<T>): Promise<T> {
  return measureCallback(name, options?.squelch ? squelch(name, callback) : callback, options?.data, options?.onResult)
}

/** Marks 5xx status codes as errors. */
export function errorOn5xx(response: Response): { status: string; error?: string } {
  const error = response.status >= 500 && response.status < 600 ? response.statusText : undefined
  return { status: response.status.toString(), error }
}
