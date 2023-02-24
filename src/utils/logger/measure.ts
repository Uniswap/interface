import 'zone.js'

// Logging of "descendant tasks" is accomplished with zone.js. When a callback is logging, any callbacks it triggers
// (including async callbacks) will be triggered in the same zone, and so can be tracked back to the logging "parent"
// callback.

/** Data to include with a log. This will be passed to the server as-is, and must be serializable. */
export type LoggingData = Record<string, unknown>

export interface Log {
  name: string
  parent?: string

  time: number
  duration?: number

  data: LoggingData
  error?: string
}

export interface LoggingState {
  /**
   * Used to prevent non-blocking async tasks that outlast the instigating task from logging,
   * and to squelch logs from async tasks triggered by code wrapped in {@link squelch}.
   */
  isLogging: boolean
  /** Used to collect Logs across tasks. */
  logs: Log[]
}

export const LOGGING_KEY = '@uniswap/logging'
const DEFAULT_STATE: LoggingState = { isLogging: false, logs: [] }

function getLogs() {
  const zone = Zone.current
  const state: LoggingState = zone.get(LOGGING_KEY) ?? DEFAULT_STATE
  return state.isLogging ? state.logs : undefined
}

/** Logs data. */
export function log(name: string, data?: LoggingData, error?: string): Log {
  const now = performance.now()
  const parent = Zone.current === Zone.root ? undefined : Zone.current.name
  const log: Log = { name, parent, time: now, data: data ?? {}, error }

  const logs = getLogs()
  if (logs) {
    performance.mark(name, { detail: data })
    logs.push(log)
  }

  return log
}

/**
 * Measures and logs a callback if it occurs within the zone of a logged callback
 * (ie if it was triggered by a callback passed to {@link logCallback}.
 */
export async function measureCallback<T>(
  name: string,
  callback: () => Promise<T>,
  data?: LoggingData,
  onResult?: (result: T, data?: LoggingData) => LoggingData
): Promise<T> {
  let error: string | undefined
  const start = performance.now()
  try {
    const result = await callback()
    data = onResult?.(result, data)
    return result
  } catch (e) {
    error = e
    throw e
  } finally {
    const end = performance.now()
    const logs = getLogs()
    if (logs) {
      performance.measure(name, { detail: data, end, start })
      const parent =
        Zone.current.name === name
          ? Zone.current.parent === Zone.root
            ? undefined
            : Zone.current.parent?.name
          : Zone.current.name
      logs.push({
        name,
        parent,
        time: start,
        duration: end - start,
        data: data ?? {},
        error,
      })
    }
  }
}

/**
 * Measures and logs a callback and its descendants
 * (ie calls to ${@link measureCallback} triggered by the callback).
 */
export async function logCallback<T>(
  name: string,
  callback: () => Promise<T>,
  onLogs: (logs: Log[]) => void,
  data?: LoggingData,
  onResult?: (result: T, data?: LoggingData) => LoggingData
): Promise<T> {
  const state: LoggingState = { isLogging: true, logs: [] }
  const zone = Zone.current.fork({ name, properties: { [LOGGING_KEY]: state } })

  try {
    return await zone.run(() => measureCallback(name, callback, data, onResult))
  } finally {
    // Prevent non-blocking async tasks (which have a longer lifetime than the forking task) from being logged.
    state.isLogging = false
    onLogs(state.logs)
  }
}

/** Prevents measurements from being logged from a callback's descendants. */
export function squelch<T>(name: string, callback: () => Promise<T>): () => Promise<T> {
  const state: LoggingState = { isLogging: false, logs: [] }
  return () => Zone.current.fork({ name, properties: { [LOGGING_KEY]: state } }).run(callback)
}
