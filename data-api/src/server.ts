/**
 * Node HTTP host for the HookSwap data-api (Connect-RPC / protobuf).
 *
 * Serves data.v1.DataApiService via @connectrpc/connect-node's connectNodeAdapter, wrapped in a
 * plain http.Server so we can add: (1) strict credentialed-CORS (same policy as the trading
 * adapter), (2) a /health endpoint, (3) path-prefix tolerance so it works behind an nginx location
 * like `/v2/` regardless of whether nginx strips the prefix.
 *
 * The interface reaches Connect unary methods at `{baseUrl}/data.v1.DataApiService/{Method}`.
 * Point the interface's v2 Connect transport base URL at this host (see README / DEPLOY.md).
 *
 * Run: `npm run dev` (ts-node) or `npm run build && npm start`.
 */

import { createServer, IncomingMessage, ServerResponse } from 'http'
import type { ConnectRouter } from '@connectrpc/connect'
import { connectNodeAdapter } from '@connectrpc/connect-node'
import { DataApiService } from '@uniswap/client-data-api/dist/data/v1/api_connect'
import { createDataApiImpl } from './handlers'
import { supportedChainIds } from './chains'

// --- Connect router: register the DataApiService with our handlers ---
const routes = (router: ConnectRouter): void => {
  router.service(DataApiService, createDataApiImpl())
}
const rpcHandler = connectNodeAdapter({ routes })

// The Connect service path always contains this marker; we slice the request URL from here so any
// upstream prefix (`/v2`, `/`, an nginx sub-path, ...) is tolerated without extra config.
const SERVICE_PATH_MARKER = '/data.v1.DataApiService/'

// --- CORS (browser calls this with credentials: 'include') ---
// Identical policy to trading-api-adapter/src/server.ts: strict exact-origin allowlist from
// CORS_ALLOW_ORIGIN. We echo the request Origin + Access-Control-Allow-Credentials:true ONLY on an
// exact allowlist match (never reflect an arbitrary origin with credentials). "*" enables public,
// non-credentialed access with ACAC omitted (credentials + "*" is invalid per spec).
const CORS_ALLOWLIST = new Set(
  (process.env.CORS_ALLOW_ORIGIN || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
)
const CORS_WILDCARD = CORS_ALLOWLIST.has('*')

function applyCorsHeaders(req: IncomingMessage, res: ServerResponse): void {
  const requestOrigin = req.headers.origin
  // Always Vary on Origin so a cache/proxy can't serve one origin's ACAO to another.
  res.setHeader('Vary', 'Origin')
  if (requestOrigin && CORS_ALLOWLIST.has(requestOrigin)) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
  } else if (CORS_WILDCARD) {
    res.setHeader('Access-Control-Allow-Origin', '*')
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader(
    'Access-Control-Allow-Headers',
    // Connect-Web sends Content-Type + Connect-Protocol-Version (+ optional timeout / user-agent).
    'content-type,connect-protocol-version,connect-timeout-ms,x-user-agent',
  )
  // Let the browser read the Connect error trailers on failures.
  res.setHeader('Access-Control-Expose-Headers', 'connect-protocol-version')
}

const server = createServer((req: IncomingMessage, res: ServerResponse) => {
  applyCorsHeaders(req, res)

  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }

  const url = req.url || '/'

  if (url === '/health' || url.endsWith('/health')) {
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(
      JSON.stringify({
        status: 'ok',
        service: 'hookswap-data-api',
        mode: 'onchain-current-state',
        implemented: ['listTokens', 'listTopPools'],
        stubbed: 'all other DataApiService methods (need phase-2 event indexer / USD oracle)',
        supportedChainIds: supportedChainIds(),
      }),
    )
    return
  }

  // Normalize any upstream prefix down to the bare Connect service path before delegating.
  const markerIdx = url.indexOf(SERVICE_PATH_MARKER)
  if (markerIdx > 0) {
    req.url = url.slice(markerIdx)
  }

  rpcHandler(req, res)
})

const PORT = Number(process.env.PORT || 4092)
server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[hookswap-data-api] listening on :${PORT}  (Connect-RPC data.v1.DataApiService; /health for status)`)
})

export { server }
