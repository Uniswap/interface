// oxlint-disable eslint-js/no-restricted-syntax -- allow process.env access here
/* oxlint-disable max-params */
/**
 * Structured JSON Logger Implementation
 *
 * Writes single JSON lines to stdout for Datadog Agent sidecar ingestion.
 * NOT console.log — raw process.stdout.write to avoid formatting overhead.
 *
 * Integrates PII scrubbing as the last step before serialization (single enforcement point).
 * Adds Datadog correlation fields for trace/log correlation.
 */

import type { Scrubber } from '@universe/privacy'
import { createScrubber } from '@universe/privacy'
import type { LogContext, Logger, LoggerFactory, LogLevel } from './types'
import { LOG_LEVEL_ORDER } from './types'
import { serializeErrorForWideEvent } from './wideEvent'

function shouldLog(level: LogLevel, minLevel: LogLevel): boolean {
  return LOG_LEVEL_ORDER[level] >= LOG_LEVEL_ORDER[minLevel]
}

/** DD correlation defaults — trace/span IDs are empty until overridden by request-scoped .child() context. */
function getDDCorrelation(service: string | undefined): Record<string, string> {
  return {
    'dd.trace_id': '',
    'dd.span_id': '',
    'dd.service': process.env['DD_SERVICE'] || service || '',
    'dd.version': process.env['DD_VERSION'] || '',
    'dd.env': process.env['DD_ENV'] || '',
  }
}

function writeLine(
  level: LogLevel,
  service: string | undefined,
  message: string,
  scrub: Scrubber,
  context?: LogContext,
  error?: unknown,
): void {
  const line: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    level,
    ...(service ? { service } : {}),
    message,
    ...getDDCorrelation(service),
    ...context,
  }
  if (error != null) {
    line['error'] = serializeErrorForWideEvent(error)
  }

  // Scrub is the LAST step before serialization — single enforcement point
  const scrubbed = scrub(line)
  process.stdout.write(`${JSON.stringify(scrubbed)}\n`)
}

/**
 * Create a structured JSON logger that writes newline-delimited JSON to stdout.
 * Scrubber is injected explicitly — not imported as a side effect.
 */
export function createStructuredJsonLogger(
  service?: string,
  parentContext?: LogContext,
  minLevel: LogLevel = 'info',
  scrub?: Scrubber,
): Logger {
  const scrubFn = scrub ?? createScrubber()

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
      writeLine('trace', service, message, scrubFn, mergeContext(context))
    },

    debug(message: string, context?: LogContext): void {
      if (!shouldLog('debug', minLevel)) {
        return
      }
      writeLine('debug', service, message, scrubFn, mergeContext(context))
    },

    info(message: string, context?: LogContext): void {
      if (!shouldLog('info', minLevel)) {
        return
      }
      writeLine('info', service, message, scrubFn, mergeContext(context))
    },

    warn(message: string, context?: LogContext): void {
      if (!shouldLog('warn', minLevel)) {
        return
      }
      writeLine('warn', service, message, scrubFn, mergeContext(context))
    },

    error(message: string, error?: unknown, context?: LogContext): void {
      if (!shouldLog('error', minLevel)) {
        return
      }
      writeLine('error', service, message, scrubFn, mergeContext(context), error)
    },

    fatal(message: string, error?: unknown, context?: LogContext): void {
      if (!shouldLog('fatal', minLevel)) {
        return
      }
      writeLine('fatal', service, message, scrubFn, mergeContext(context), error)
    },

    child(context: LogContext): Logger {
      const merged = parentContext ? { ...parentContext, ...context } : context
      return createStructuredJsonLogger(service, merged, minLevel, scrubFn)
    },
  }
}

/**
 * Structured JSON logger factory — use in production (ECS + Datadog)
 */
export function createStructuredJsonLoggerFactory(minLevel: LogLevel = 'info'): LoggerFactory {
  const scrub = createScrubber()
  return {
    createLogger(service: string): Logger {
      return createStructuredJsonLogger(service, undefined, minLevel, scrub)
    },
  }
}

export const structuredJsonLoggerFactory: LoggerFactory = createStructuredJsonLoggerFactory('info')
