/* oxlint-disable max-params */
/**
 * Client Logger
 *
 * Implements the Logger interface by converting log calls into LogEntry
 * objects and forwarding them to a LogTransport.
 */

import type { LogContext, LogEntry, Logger, LoggerFactory, LogLevel, LogTransport } from './types'
import { LOG_LEVEL_ORDER } from './types'

function shouldLog(level: LogLevel, minLevel: LogLevel): boolean {
  return LOG_LEVEL_ORDER[level] >= LOG_LEVEL_ORDER[minLevel]
}

function serializeError(err: unknown): LogEntry['error'] | undefined {
  if (!err) {
    return undefined
  }
  if (err instanceof Error) {
    return { message: err.message, stack: err.stack }
  }
  return { message: String(err) }
}

function buildEntry(
  level: LogLevel,
  message: string,
  service: string | undefined,
  context: LogContext | undefined,
  error?: unknown,
): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    ...(service ? { service } : {}),
    message,
    ...(context && Object.keys(context).length > 0 ? { context } : {}),
    ...(error ? { error: serializeError(error) } : {}),
  }
}

export function createClientLogger(
  transport: LogTransport,
  service?: string,
  parentContext?: LogContext,
  minLevel: LogLevel = 'warn',
): Logger {
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
    trace(message, context?): void {
      if (!shouldLog('trace', minLevel)) {
        return
      }
      transport.send([buildEntry('trace', message, service, mergeContext(context))])
    },

    debug(message, context?): void {
      if (!shouldLog('debug', minLevel)) {
        return
      }
      transport.send([buildEntry('debug', message, service, mergeContext(context))])
    },

    info(message, context?): void {
      if (!shouldLog('info', minLevel)) {
        return
      }
      transport.send([buildEntry('info', message, service, mergeContext(context))])
    },

    warn(message, context?): void {
      if (!shouldLog('warn', minLevel)) {
        return
      }
      transport.send([buildEntry('warn', message, service, mergeContext(context))])
    },

    error(message, error?, context?): void {
      if (!shouldLog('error', minLevel)) {
        return
      }
      transport.send([buildEntry('error', message, service, mergeContext(context), error)])
    },

    fatal(message, error?, context?): void {
      if (!shouldLog('fatal', minLevel)) {
        return
      }
      transport.send([buildEntry('fatal', message, service, mergeContext(context), error)])
    },

    child(context): Logger {
      const merged = parentContext ? { ...parentContext, ...context } : context
      return createClientLogger(transport, service, merged, minLevel)
    },
  }
}

export function createClientLoggerFactory(transport: LogTransport, minLevel: LogLevel = 'warn'): LoggerFactory {
  return {
    createLogger(service): Logger {
      return createClientLogger(transport, service, undefined, minLevel)
    },
  }
}
