/**
 * tRPC Logging Middleware Function
 *
 * Plain async function — no tRPC dependency.
 * Consumer wraps it with their own `t.middleware()`.
 */

import type { Logger, WideEvent } from '@universe/logger'

/**
 * Context shape required by the logging middleware.
 * Your tRPC context must extend this interface.
 */
export interface LoggingMiddlewareContext {
  logger: Logger
  wideEvent: WideEvent
}

export interface LoggingMiddlewareOptions {
  /** Extra flat fields for the `procedure.failed` log line, derived from the error (e.g. upstream status). */
  errorContext?: (error: unknown) => Record<string, unknown>
}

export interface LoggingMiddlewareOpts<TResult> {
  ctx: LoggingMiddlewareContext
  next: () => Promise<TResult>
  path: string
}

/**
 * Logging middleware logic for tRPC procedures.
 *
 * Returns a plain function — not a tRPC middleware. The consumer
 * wraps it with `t.middleware()` at their boundary:
 *
 * @example
 * ```typescript
 * import { createLoggingMiddlewareFn } from '@universe/trpc'
 * const loggingMiddleware = t.middleware(createLoggingMiddlewareFn({ errorContext: upstreamErrorFields }))
 * ```
 */
export function createLoggingMiddlewareFn(options: LoggingMiddlewareOptions = {}) {
  const errorContext = options.errorContext ?? (() => ({}))
  return async function loggingMiddlewareFn<TResult extends { ok: boolean; error?: { code?: string } }>(
    opts: LoggingMiddlewareOpts<TResult>,
  ): Promise<TResult> {
    const { ctx, next, path } = opts
    const start = Date.now()
    let outcome: 'success' | 'error' = 'success'
    let error_code: string | undefined
    try {
      const result = await next()
      if (!result.ok) {
        outcome = 'error'
        error_code = result.error?.code
        ctx.logger.error('procedure.failed', result.error, {
          procedure: path,
          error_code,
          ...errorContext(result.error),
        })
        ctx.wideEvent.addError(result.error, 'trpc_procedure')
      }
      return result
    } catch (error) {
      outcome = 'error'
      error_code = 'INTERNAL_SERVER_ERROR'
      ctx.logger.error('procedure.error', error, { procedure: path, ...errorContext(error) })
      ctx.wideEvent.addError(error, 'trpc_procedure')
      throw error
    } finally {
      const duration_ms = Date.now() - start
      ctx.wideEvent.addProcedure({ name: path, duration_ms, outcome, error_code })
    }
  }
}

/** The default logging middleware, with no extra error fields. */
export const loggingMiddlewareFn = createLoggingMiddlewareFn()
