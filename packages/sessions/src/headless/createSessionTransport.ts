// Lives here rather than in @universe/chains (which owns transport composition) because it
// depends on the node-only headless client (fs-backed session store) and chains' bundle graph
// must stay browser-safe. Revisit if chains grows a node-only subpath or a shared Session gate.
import { DEFAULT_GATEWAY_BASE_URL } from '@universe/sessions/src/headless/createHeadlessSessionClient'
import type { HeadlessSessionClient } from '@universe/sessions/src/headless/createHeadlessSessionClient'
import { http, HttpRequestError } from 'viem'
import type { EIP1193RequestFn, Transport } from 'viem'

// UniRPC parity with packages/chains: the gateway has its own latency SLOs, so a
// slow call should fail fast (6s) instead of hanging for viem's 10s default.
const DEFAULT_RPC_TIMEOUT_MS = 6000

/**
 * viem's http transport starts JSON-RPC request ids at 0. The UniRPC gateway used to
 * silently drop id:0 through proto3 JSON serialization (fixed upstream in backend PR
 * 7505); like packages/chains, keep a client-side guard as defense-in-depth: rewrite
 * id:0 to a positive integer before the body leaves the transport. Module-scoped so
 * all factory instances share one stream — ids only need to be unique within a single
 * request/response pair.
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

function isUnauthenticatedError(error: unknown): boolean {
  return error instanceof HttpRequestError && error.status === 401
}

interface CreateSessionTransportContext {
  /** Session client whose headers authenticate every request and whose `recover()` heals 401s. */
  client: HeadlessSessionClient
  /** Entry-gateway base URL. Default: the headless client default (staging). */
  gatewayBaseUrl?: string
  /** Request timeout in ms. Default: 6000 (UniRPC parity with packages/chains). */
  timeoutMs?: number
}

/** Builds a session-authed viem {@link Transport} for one UniRPC chain endpoint. */
type SessionTransportFactory = (chainId: number) => Transport

/**
 * Creates a factory of session-authed viem HTTP transports over the UniRPC entry
 * gateway: `transportFor(chainId)` targets `{gatewayBaseUrl}/rpc/{chainId}`.
 *
 * Behavior:
 * - **Session headers per request** — `client.getSessionHeaders()` is resolved on every
 *   request (never cached at construction), so a recovered session is picked up
 *   transparently. The session is established *before* the RPC call enters viem's
 *   request timeout, keeping a cold bootstrap (hashcash solve) out of the RPC budget.
 * - **id:0 rewrite** — see {@link patchJsonRpcIdInInit}.
 * - **401 self-heal** — an HTTP 401 triggers a single `client.recover()` (single-flight
 *   in the client) and exactly one retry with fresh headers; a second 401 propagates as
 *   the underlying `HttpRequestError`. Non-401 failures propagate untouched.
 */
function createSessionTransport(ctx: CreateSessionTransportContext): SessionTransportFactory {
  const gatewayBaseUrl = ctx.gatewayBaseUrl ?? DEFAULT_GATEWAY_BASE_URL
  const timeoutMs = ctx.timeoutMs ?? DEFAULT_RPC_TIMEOUT_MS

  return (chainId: number): Transport => {
    const buildInnerTransport = http(`${gatewayBaseUrl}/rpc/${chainId}`, {
      onFetchRequest: async (_request, init) => {
        patchJsonRpcIdInInit(init)
        const sessionHeaders = await ctx.client.getSessionHeaders()
        return {
          ...init,
          headers: {
            ...(init.headers as Record<string, string>),
            ...sessionHeaders,
          },
        }
      },
      timeout: timeoutMs,
    })

    return (params) => {
      const innerTransport = buildInnerTransport(params)

      const request: EIP1193RequestFn = async (args, options) => {
        // Establish/load the session up front: onFetchRequest runs inside viem's
        // request timeout, so bootstrapping there would eat the RPC budget. On the
        // warm path this is a cheap storage read.
        await ctx.client.getSessionHeaders()
        try {
          return await innerTransport.request(args, options)
        } catch (error) {
          if (!isUnauthenticatedError(error)) {
            throw error
          }
          await ctx.client.recover()
          return await innerTransport.request(args, options)
        }
      }

      return { ...innerTransport, request }
    }
  }
}

export { createSessionTransport, DEFAULT_RPC_TIMEOUT_MS }
export type { CreateSessionTransportContext, SessionTransportFactory }
