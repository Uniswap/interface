/* oxlint-disable max-params */
/**
 * Console Logger Implementation
 *
 * Simple console-based logger for development and debugging.
 * Structured output with timestamps and context.
 */

import type { LogContext, Logger, LoggerFactory, LogLevel } from './types'
import { LOG_LEVEL_ORDER } from './types'

function shouldLog(level: LogLevel, minLevel: LogLevel): boolean {
  return LOG_LEVEL_ORDER[level] >= LOG_LEVEL_ORDER[minLevel]
}

/**
 * Format timestamp for log output
 */
function formatTimestamp(): string {
  const now = new Date()
  return now.toISOString().slice(11, 23) // HH:mm:ss.SSS
}

/**
 * Format context for log output
 */
function formatContext(context?: LogContext): string {
  if (!context || Object.keys(context).length === 0) {
    return ''
  }
  return ` ${JSON.stringify(context)}`
}

/**
 * Create a console logger with optional service prefix and inherited context
 */
export function createConsoleLogger(
  service?: string,
  parentContext?: LogContext,
  minLevel: LogLevel = 'debug',
): Logger {
  const prefix = service ? `[${service}]` : ''

  function mergeContext(context?: LogContext): LogContext | undefined {
    if (!parentContext) {
      return context
    }
    if (!context) {
      return parentContext
    }
    return { ...parentContext, ...context }
  }

  return {
    trace(message: string, context?: LogContext): void {
      if (!shouldLog('trace', minLevel)) {
        return
      }
      console.debug(`${formatTimestamp()} TRACE ${prefix} ${message}${formatContext(mergeContext(context))}`)
    },

    debug(message: string, context?: LogContext): void {
      if (!shouldLog('debug', minLevel)) {
        return
      }
      console.debug(`${formatTimestamp()} DEBUG ${prefix} ${message}${formatContext(mergeContext(context))}`)
    },

    info(message: string, context?: LogContext): void {
      if (!shouldLog('info', minLevel)) {
        return
      }
      console.info(`${formatTimestamp()} INFO ${prefix} ${message}${formatContext(mergeContext(context))}`)
    },

    warn(message: string, context?: LogContext): void {
      if (!shouldLog('warn', minLevel)) {
        return
      }
      console.warn(`${formatTimestamp()} WARN ${prefix} ${message}${formatContext(mergeContext(context))}`)
    },

    error(message: string, error?: unknown, context?: LogContext): void {
      if (!shouldLog('error', minLevel)) {
        return
      }
      const errorDetails = error instanceof Error ? { name: error.name, message: error.message } : { error }
      console.error(`${formatTimestamp()} ERROR ${prefix} ${message}`, errorDetails, mergeContext(context) ?? {})
    },

    fatal(message: string, error?: unknown, context?: LogContext): void {
      if (!shouldLog('fatal', minLevel)) {
        return
      }
      const errorDetails = error instanceof Error ? { name: error.name, message: error.message } : { error }
      console.error(`${formatTimestamp()} FATAL ${prefix} ${message}`, errorDetails, mergeContext(context) ?? {})
    },

    child(context: LogContext): Logger {
      const merged = parentContext ? { ...parentContext, ...context } : context
      return createConsoleLogger(service, merged, minLevel)
    },
  }
}

/**
 * Console logger factory — defaults to 'info' level to suppress DEBUG noise
 */
export function createConsoleLoggerFactory(minLevel: LogLevel = 'info'): LoggerFactory {
  return {
    createLogger(service: string): Logger {
      return createConsoleLogger(service, undefined, minLevel)
    },
  }
}

export const consoleLoggerFactory: LoggerFactory = createConsoleLoggerFactory('info')

/**
 * Default noop logger for when logging is disabled
 */
export const noopLogger: Logger = {
  trace: () => {},
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
  fatal: () => {},
  child(): Logger {
    return noopLogger
  },
}
