/**
 * Request-scoped context shared between Hono middleware and tRPC.
 *
 * Uses a Map keyed by trace_id (set as x-trace-id header on the request).
 * WeakMap<Request> doesn't work because Hono sub-app routing may create
 * new Request objects, breaking object identity.
 */

import type { Logger } from './types'
import type { WideEvent } from './wideEvent'

export interface RequestScopedContext {
  wideEvent: WideEvent
  logger: Logger
}

interface StoredContext extends RequestScopedContext {
  createdAt: number
}

/** Requests older than 5 minutes are considered dead */
const MAX_AGE_MS = 5 * 60 * 1000
/** Evict stale entries every 100 requests to bound Map growth */
const EVICTION_INTERVAL = 100

const contextMap = new Map<string, StoredContext>()
let operationCount = 0

function evictStaleEntries(): void {
  const now = Date.now()
  for (const [key, value] of contextMap) {
    if (now - value.createdAt > MAX_AGE_MS) {
      contextMap.delete(key)
    }
  }
}

export const requestContext = {
  set(traceId: string, ctx: RequestScopedContext): void {
    contextMap.set(traceId, { ...ctx, createdAt: Date.now() })
    if (++operationCount % EVICTION_INTERVAL === 0) {
      evictStaleEntries()
    }
  },

  get(traceId: string): RequestScopedContext | undefined {
    return contextMap.get(traceId)
  },

  /** Clean up after request completes to prevent memory leaks */
  delete(traceId: string): void {
    contextMap.delete(traceId)
  },
}
