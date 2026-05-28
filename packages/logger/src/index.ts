// Client-safe exports — no Node.js dependencies.
// Server-only exports (createServerLogger, createStackResolver, etc.) live in @universe/logger/server.

export { createClientLogger, createClientLoggerFactory } from './clientLogger'
export { consoleLoggerFactory, createConsoleLogger, createConsoleLoggerFactory, noopLogger } from './consoleLogger'
export type { RequestScopedContext } from './requestContext'
export { requestContext } from './requestContext'
export type { StackResolver, StackResolverCtx } from './sourceMapResolver'
export {
  createStructuredJsonLogger,
  createStructuredJsonLoggerFactory,
  structuredJsonLoggerFactory,
} from './structuredJsonLogger'
export type { BufferedTransportOptions } from './transports/buffered'
export { createBufferedTransport } from './transports/buffered'
export { createConsoleTransport } from './transports/console'
export type { PendingTransport } from './transports/pending'
export { createPendingTransport } from './transports/pending'
export type { LogIngestionClient } from './transports/trpc'
export { createTrpcLogTransport } from './transports/trpc'
export type { LogContext, LogEntry, Logger, LoggerFactory, LogLevel, LogTransport } from './types'
export { LOG_LEVEL_ORDER } from './types'
// Types only — value exports in @universe/logger/server
export type { ErrorSource, SerializedError, WideEvent, WideEventFactory } from './wideEvent'
