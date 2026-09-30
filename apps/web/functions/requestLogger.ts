import type { MiddlewareHandler } from 'hono'

// Addresses, ids and tx hashes — collapsed so the logged path stays a bounded facet.
const VARIABLE_SEGMENT = /^(?:0x[0-9a-fA-F]+|\d+)$/

export function classifyPath(pathname: string): string {
  return pathname.replace(/[^/]+/g, (segment) => (VARIABLE_SEGMENT.test(segment) ? ':id' : segment))
}

// JSON on stdout: the Datadog agent flattens it and reads `status` as the log level.
export function requestLogger(): MiddlewareHandler {
  return async (c, next) => {
    const startedAt = performance.now()
    try {
      await next()
    } finally {
      // finally, not after await: a handler that throws is the request most worth
      // logging, and its response is produced above this middleware by onError.
      const path = classifyPath(new URL(c.req.url).pathname)
      const status = c.res.status
      // oxlint-disable-next-line no-console
      console.log(
        JSON.stringify({
          status: status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info',
          message: `${c.req.method} ${path} ${status}`,
          http: { method: c.req.method, status_code: status, path },
          duration_ms: Math.round(performance.now() - startedAt),
        }),
      )
    }
  }
}
