/**
 * Public REST/JSON facade for the HookSwap data-api (data.hookswap.org).
 *
 * WHY THIS EXISTS: server.ts already serves the real read handlers over Connect-RPC (protobuf), which
 * the HookSwap interface speaks. This module exposes the SAME read handlers over plain, browser-friendly
 * GET/JSON so integrators (launchpads, dashboards, scripts) can consume pools/tokens/search/stats without
 * a Connect client. It is a THIN ADAPTER — no new business logic: it parses a GET query, builds the
 * handler's existing protobuf request Message, calls the SAME handler the Connect router uses, and
 * serializes the response via protobuf-es's `Message.toJson()` (JsonValue → JSON). Nothing is fabricated:
 * whatever the handler leaves unset (e.g. USD fields with no anchor pool) is simply absent from the JSON.
 *
 * READ-ONLY SURFACE: only pool / token / search / protocol-stats reads are exposed here. Wallet-scoped
 * methods (getPortfolio / getWalletBalances / listTransactions / getTransaction / listPositions) are
 * DELIBERATELY NOT exposed — they take a wallet address and stay on the credentialed Connect surface.
 *
 * CORS: these routes are served with `Access-Control-Allow-Origin: *` and NO credentials (see
 * server.ts applyCorsHeaders + isRestReadPath) — safe because they are read-only and cookie-free.
 */

import type { IncomingMessage, ServerResponse } from 'http'
import { ListTokensRequest, ListTopPoolsRequest } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { SearchTokensRequest } from '@uniswap/client-data-api/dist/data/v1/search_pb'
import { ProtocolStatsRequest } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { handleListTokens, handleListTopPools } from './handlers'
import { handleSearchTokens } from './searchHandlers'
import { handleProtocolStats } from './exploreStatsHandlers'
import { isSupportedChain } from './chains'

/**
 * The public GET routes, as path SUFFIXES. We match on suffix (path === suffix || path.endsWith(suffix))
 * so any upstream/nginx prefix (`/v2/v1/pools`, `/data/v1/pools`, ...) is tolerated exactly like the
 * `/health` branch in server.ts. None of these contains a `.vN.` dotted segment, so they are NEVER caught
 * by server.ts's `CONNECT_SERVICE_PATH_RE = /\/[\w.]+\.v\d+\.\w+\//` (which requires `<word>.v<digit>.<word>`).
 */
const REST_ROUTE_SUFFIXES = ['/v1/pools', '/v1/tokens', '/v1/search', '/v1/stats'] as const

/** Default page size for /v1/pools when `limit` is omitted (bounds the JSON payload). */
const DEFAULT_POOLS_LIMIT = 100
/** Default result cap for /v1/search when `size` is omitted (matches the handler's own default). */
const DEFAULT_SEARCH_SIZE = 50

/** True for the read-only REST paths — used by server.ts to choose the public (wildcard, no-credentials) CORS policy. */
export function isRestReadPath(path: string): boolean {
  return REST_ROUTE_SUFFIXES.some((suffix) => path === suffix || path.endsWith(suffix))
}

/** Which route (if any) a request path maps to — suffix match, prefix-tolerant. */
function matchRoute(path: string): (typeof REST_ROUTE_SUFFIXES)[number] | undefined {
  return REST_ROUTE_SUFFIXES.find((suffix) => path === suffix || path.endsWith(suffix))
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

/**
 * Parse a `chainId` query param.
 *   - absent/empty            → { }            (caller decides its own "all supported" default)
 *   - a supported chain id    → { chainId }
 *   - anything else           → { error }      (→ 400; never silently coerced or guessed)
 */
function parseChainId(params: URLSearchParams): { chainId?: number; error?: string } {
  const raw = params.get('chainId')
  if (raw === null || raw.trim() === '') {
    return {}
  }
  const n = Number(raw)
  if (!Number.isInteger(n) || !isSupportedChain(n)) {
    return { error: `unsupported or invalid chainId "${raw}"` }
  }
  return { chainId: n }
}

/** Parse a positive-integer query param (e.g. limit/size); returns undefined when absent or invalid. */
function parsePositiveInt(params: URLSearchParams, key: string): number | undefined {
  const raw = params.get(key)
  if (raw === null || raw.trim() === '') {
    return undefined
  }
  const n = Number(raw)
  return Number.isInteger(n) && n > 0 ? n : undefined
}

/**
 * Public REST facade entry point. Returns true if it handled the request (wrote a response), false if the
 * request isn't one of ours (so the caller falls through to the Connect delegation). Only GET is handled
 * here; OPTIONS preflight is answered by server.ts's shared OPTIONS branch.
 *
 * Never throws: any handler failure is caught and returned as a generic 500 JSON `{error}` (internals are
 * never leaked, data is never fabricated).
 */
export async function handleRestRequest(req: IncomingMessage, res: ServerResponse, rawUrl: string): Promise<boolean> {
  if (req.method !== 'GET') {
    return false
  }
  // Base is irrelevant — we only read pathname + searchParams from the (possibly path-only) request URL.
  const parsed = new URL(rawUrl, 'http://localhost')
  const route = matchRoute(parsed.pathname)
  if (!route) {
    return false
  }
  const params = parsed.searchParams

  try {
    switch (route) {
      case '/v1/pools': {
        const { chainId, error } = parseChainId(params)
        if (error) {
          sendJson(res, 400, { error })
          return true
        }
        // chainId present → that one chain; absent → handler defaults to all supported chains.
        const limit = parsePositiveInt(params, 'limit') ?? DEFAULT_POOLS_LIMIT
        const resp = await handleListTopPools(
          new ListTopPoolsRequest({ chainIds: chainId ? [chainId] : [], pageSize: limit }),
        )
        // handleListTopPools returns every discovered pool (it does not itself page); truncate at the
        // facade so `limit` is honest. Pools are in discovery order, NOT ranked by TVL until a USD anchor
        // pool exists — documented in docs/developers/data-api.md.
        const json = resp.toJson() as { pools?: unknown[]; [k: string]: unknown }
        if (Array.isArray(json.pools)) {
          json.pools = json.pools.slice(0, limit)
        }
        sendJson(res, 200, json)
        return true
      }
      case '/v1/tokens': {
        const { chainId, error } = parseChainId(params)
        if (error) {
          sendJson(res, 400, { error })
          return true
        }
        const resp = await handleListTokens(new ListTokensRequest({ chainIds: chainId ? [chainId] : [] }))
        sendJson(res, 200, resp.toJson())
        return true
      }
      case '/v1/search': {
        const query = (params.get('q') ?? '').trim()
        if (!query) {
          sendJson(res, 400, { error: 'missing required query param "q"' })
          return true
        }
        const { chainId, error } = parseChainId(params)
        if (error) {
          sendJson(res, 400, { error })
          return true
        }
        const size = parsePositiveInt(params, 'size') ?? DEFAULT_SEARCH_SIZE
        const resp = await handleSearchTokens(
          new SearchTokensRequest({ searchQuery: query, chainIds: chainId ? [chainId] : [], size }),
        )
        sendJson(res, 200, resp.toJson())
        return true
      }
      case '/v1/stats': {
        const { chainId, error } = parseChainId(params)
        if (error) {
          sendJson(res, 400, { error })
          return true
        }
        // ProtocolStatsRequest.chainId is a STRING: a specific id or the ALL_NETWORKS sentinel
        // (resolveRequestChainIds treats '' as all supported → we pass '' when chainId is omitted).
        const resp = await handleProtocolStats(new ProtocolStatsRequest({ chainId: chainId ? String(chainId) : '' }))
        sendJson(res, 200, resp.toJson())
        return true
      }
      default:
        return false
    }
  } catch {
    // Never leak internals, never fabricate data — a generic 500.
    sendJson(res, 500, { error: 'internal error' })
    return true
  }
}
