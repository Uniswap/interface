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

/**
 * Logging middleware logic for tRPC procedures.
 *
 * This is a plain function — not a tRPC middleware. The consumer
 * wraps it with `t.middleware()` at their boundary:
 *
 * @example
 * ```typescript
 * import { loggingMiddlewareFn } from '@universe/trpc'
 * const loggingMiddleware = t.middleware(loggingMiddlewareFn)
 * ```
 */
export async function loggingMiddlewareFn<TResult extends { ok: boolean; error?: { code?: string } }>(opts: {
  ctx: LoggingMiddlewareContext
  next: () => Promise<TResult>
  path: string
}): Promise<TResult> {
  const { ctx, next, path } = opts
  const start = Date.now()
  let outcome: 'success' | 'error' = 'success'
  let error_code: string | undefined
  try {
    const result = await next()
    if (!result.ok) {
      outcome = 'error'
      error_code = result.error?.code
      ctx.logger.error('procedure.failed', result.error, { procedure: path, error_code })
      ctx.wideEvent.addError(result.error, 'trpc_procedure')
    }
    return result
  } catch (error) {
    outcome = 'error'
    error_code = 'INTERNAL_SERVER_ERROR'
    ctx.logger.error('procedure.error', error, { procedure: path })
    ctx.wideEvent.addError(error, 'trpc_procedure')
    throw error
  } finally {
    const duration_ms = Date.now() - start
    ctx.wideEvent.addProcedure({ name: path, duration_ms, outcome, error_code })
  }
}
