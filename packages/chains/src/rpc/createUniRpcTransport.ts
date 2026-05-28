import { http } from 'viem'
import type { UniRpcConfig } from './getUniRpcConfig'
import { HEADER_RESOLVE_TIMEOUT_MS, withTimeout } from './withTimeout'

// UniRPC requests should be fast — the gateway has its own latency SLOs and
// fronts a curated provider set. 6s is intentionally tighter than viem's
// 10s default: a slow UniRPC call should fail fast so the legacy fallback
// path can take over before the user notices a hang.
const UNIRPC_TIMEOUT_MS = 6000

/**
 * viem's http transport starts JSON-RPC request IDs at 0. The UniRPC backend
 * used to silently drop id:0 through proto3 JSON serialization (fixed upstream
 * in backend PR 7505), but we keep a client-side guard as defense-in-depth:
 * rewrite id:0 to a monotonically-incrementing positive integer before the
 * body leaves the transport.
 *
 * Counter is module-scoped so every factory instance shares the same stream —
 * id uniqueness only matters within a single JSON-RPC request/response pair,
 * so a shared counter is fine and avoids per-factory state.
 */
let nextId = 1

function patchJsonRpcIdInInit(init: RequestInit): void {
  if (typeof init.body !== 'string') {
    return
  }
  try {
    const parsed = JSON.parse(init.body) as { id?: unknown }
    if (parsed.id === 0) {
      parsed.id = nextId++
      init.body = JSON.stringify(parsed)
    }
  } catch {
    // Body isn't JSON — nothing to patch.
  }
}

/** Web: session cookies sent automatically by the browser via credentials: 'include' */
type CookieSession = { type: 'cookies' }

/** Ext/Mobile: session headers resolved per-request */
type HeaderSession = { type: 'headers'; getSessionHeaders: () => Promise<Record<string, string>> }

export type SessionStrategy = CookieSession | HeaderSession

interface UniRpcTransportFactoryCtx {
  session: SessionStrategy
}

interface UniRpcTransportInput {
  config: UniRpcConfig
}

/**
 * Creates a factory that builds viem HTTP transports configured for UniRPC.
 *
 * Session auth is explicit — the caller declares the strategy at the boundary:
 * - Web: `{ type: 'cookies' }` — browser sends session cookies via credentials: 'include'
 * - Ext/Mobile: `{ type: 'headers', getSessionHeaders }` — resolves x-session-id per-request
 *
 * @example
 * ```ts
 * // At the boundary (app init)
 * const buildUniRpcTransport = createUniRpcTransportFactory({
 *   session: { type: 'cookies' },
 * })
 *
 * // In business logic
 * const transport = buildUniRpcTransport({ config })
 * const client = createPublicClient({ chain, transport })
 * ```
 */
export function createUniRpcTransportFactory(ctx: UniRpcTransportFactoryCtx) {
  return (input: UniRpcTransportInput) => {
    const { config } = input

    if (ctx.session.type === 'headers') {
      const { getSessionHeaders } = ctx.session
      return http(config.rpcUrl, {
        fetchOptions: {
          headers: config.headers,
        },
        onFetchRequest: async (_request, init) => {
          // Bound header resolution so a hung session/device-id provider
          // can't hang the fetch past the transport timeout. The 6s
          // UNIRPC_TIMEOUT_MS only applies after fetch is invoked — without
          // this, header resolution eats into or eliminates that budget.
          const sessionHeaders = await withTimeout(getSessionHeaders(), {
            timeoutMs: HEADER_RESOLVE_TIMEOUT_MS,
            label: 'getSessionHeaders',
          })
          patchJsonRpcIdInInit(init)
          return {
            ...init,
            headers: {
              ...(init.headers as Record<string, string>),
              ...sessionHeaders,
            },
          }
        },
        timeout: UNIRPC_TIMEOUT_MS,
      })
    }

    return http(config.rpcUrl, {
      fetchOptions: {
        headers: config.headers,
        credentials: 'include',
      },
      onFetchRequest: (_request, init) => {
        patchJsonRpcIdInInit(init)
      },
      timeout: UNIRPC_TIMEOUT_MS,
    })
  }
}
