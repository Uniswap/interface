/**
 * Logger Interface
 *
 * Simple logger contract for services and repositories.
 * Allows swapping between console logging (dev) and production logging.
 */

/**
 * Log context for structured logging
 */
export interface LogContext {
  /** Service or component name */
  service?: string
  /** Operation being performed */
  operation?: string
  /** User ID if available */
  userId?: string
  /** Additional metadata */
  [key: string]: unknown
}

/**
 * Logger interface for dependency injection
 */
export interface Logger {
  /** Trace level logging - finest granularity, usually off */
  trace(message: string, context?: LogContext): void

  /** Debug level logging - development only */
  debug(message: string, context?: LogContext): void

  /** Info level logging - general information */
  info(message: string, context?: LogContext): void

  /** Warning level logging - potential issues */
  warn(message: string, context?: LogContext): void

  /** Error level logging - errors and exceptions */
  error(message: string, error?: unknown, context?: LogContext): void

  /** Fatal level logging - unrecoverable errors, process should exit */
  fatal(message: string, error?: unknown, context?: LogContext): void

  /** Create a child logger with preset context fields merged into every log call */
  child(context: LogContext): Logger
}

/**
 * Log levels in order of severity.
 * Loggers should only emit messages at or above their configured level.
 */
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'

export const LOG_LEVEL_ORDER: Record<LogLevel, number> = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
  fatal: 5,
}

/**
 * Factory to create a child logger with preset context
 */
export interface LoggerFactory {
  /** Create a logger with preset service context */
  createLogger(service: string): Logger
}

/** A single log entry ready for transport */
export interface LogEntry {
  timestamp: string
  level: LogLevel
  service?: string
  message: string
  context?: LogContext
  error?: { message: string; stack?: string }
}

/** Moves log entries from point A to point B */
export interface LogTransport {
  send(entries: LogEntry[]): void
}
