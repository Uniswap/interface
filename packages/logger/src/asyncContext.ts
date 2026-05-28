/**
 * Request Context Types
 *
 * Defines the RequestContext shape and the abstract RequestStore contract.
 * The actual AsyncLocalStorage instance is created at the app boundary —
 * this module has no Node.js dependencies.
 */

import type { Logger } from './types'
import type { WideEvent } from './wideEvent'

/** Typed context stored per-request */
export interface RequestContext {
  traceId: string
  logger: Logger
  wideEvent: WideEvent
  userId?: string
}

/** Abstract store — matches AsyncLocalStorage's shape without importing node:async_hooks */
export interface RequestStore {
  getStore(): RequestContext | undefined
  run<R>(store: RequestContext, callback: () => R): R
}
