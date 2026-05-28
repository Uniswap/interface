/**
 * Server Logger Factory
 *
 * createServerLogger(ctx) → ServerLogger
 *
 * The app boundary provides platform deps (ALS, write function).
 * Returns a wired instance with .create(), .getRequestLogger(), .runWithContext().
 */

import type { RequestContext, RequestStore } from './asyncContext'
import type { RequestScopedContext } from './requestContext'
import { createStructuredJsonLoggerFactory } from './structuredJsonLogger'
import type { Logger, LoggerFactory, LogLevel } from './types'

export interface ServerLoggerCtx {
  /** The AsyncLocalStorage instance — created by the app */
  requestStore: RequestStore
  /** Map-based fallback context (import { requestContext } from '@universe/logger') */
  requestContext: { get(traceId: string): RequestScopedContext | undefined }
  /** Minimum log level (defaults to 'info') */
  minLevel?: LogLevel
  /** Service name for the fallback logger (defaults to 'unknown') */
  serviceName?: string
}

export interface ServerLogger {
  /** Create a named logger: logger.create('dev-portal') */
  create: (service: string) => Logger
  /** Get the request-scoped logger (ALS → Map fallback → fallback logger) */
  getRequestLogger: (request: Request) => Logger
  /** Get the current request context from the ALS (if inside runWithContext) */
  getRequestContext: () => RequestContext | undefined
  /** Wrap a request in context scope */
  runWithContext: <R>(ctx: RequestContext, fn: () => R) => R
  /** The underlying factory (for passing to code that expects LoggerFactory) */
  loggerFactory: LoggerFactory
}

export function createServerLogger(ctx: ServerLoggerCtx): ServerLogger {
  const factory = createStructuredJsonLoggerFactory(ctx.minLevel ?? 'info')
  const fallbackLogger = factory.createLogger(ctx.serviceName ?? 'unknown')

  function getRequestLogger(request: Request): Logger {
    // Primary: ALS context
    const asyncCtx = ctx.requestStore.getStore()
    if (asyncCtx) {
      return asyncCtx.logger
    }

    // Secondary: Map-based context via trace ID header
    const traceId = request.headers.get('x-trace-id')
    if (traceId) {
      const mapCtx = ctx.requestContext.get(traceId)
      if (mapCtx) {
        return mapCtx.logger
      }
    }

    fallbackLogger.warn('request_logger.fallback', { reason: 'missing_trace_id' })
    return fallbackLogger
  }

  return {
    create: (service: string) => factory.createLogger(service),
    getRequestLogger,
    getRequestContext: () => ctx.requestStore.getStore(),
    runWithContext: <R>(reqCtx: RequestContext, fn: () => R): R => ctx.requestStore.run(reqCtx, fn),
    loggerFactory: factory,
  }
}
