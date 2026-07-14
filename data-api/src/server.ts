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
import { SearchService } from '@uniswap/client-data-api/dist/data/v1/search_connect'
import { ExploreStatsService } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_connect'
import { createDataApiImpl } from './handlers'
import { createSearchApiImpl } from './searchHandlers'
import { createExploreStatsImpl } from './exploreStatsHandlers'
import { supportedChainIds } from './chains'
import { startIngestLoop } from './indexer/ingest'

// --- Connect router: register DataApiService + SearchService + ExploreStatsService with our handlers ---
const routes = (router: ConnectRouter): void => {
  router.service(DataApiService, createDataApiImpl())
  router.service(SearchService, createSearchApiImpl())
  // ExploreStatsService (package `uniswap.explore.v1.`) — protocol TVL/volume stats for the Terminal's
  // Landing hero + Analytics screen. Different package prefix than data.v1., so path routing below is
  // generic (matches any Connect service path), not hardcoded to data.v1.
  router.service(ExploreStatsService, createExploreStatsImpl())
}
const rpcHandler = connectNodeAdapter({ routes })

// A Connect service path looks like `/<package>.vN.<Service>/<Method>` (e.g. `/data.v1.DataApiService/…`
// or `/uniswap.explore.v1.ExploreStatsService/…`). We slice the request URL from the START of that path
// so any upstream prefix (`/v2`, `/`, an nginx sub-path, ...) is tolerated without extra config, for ANY
// registered service regardless of its package. GENERIC — not tied to a single package like data.v1.
const CONNECT_SERVICE_PATH_RE = /\/[\w.]+\.v\d+\.\w+\//

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
        mode: 'onchain-current-state + event-indexer',
        indexer: process.env.INDEXER_ENABLED === 'true' ? 'enabled' : 'disabled',
        implemented: [
          'listTokens',
          'listTopPools',
          'searchTokens',
          'getPortfolio',
          'listTransactions',
          'getTransaction',
          'listPositions',
          // getWalletBalances → Terminal Portfolio Net worth + 24h KPIs (aggregate-only). Real held-token
          // count always; USD aggregate auto-populates once the WETH/USDG anchor pool is ingested.
          'getWalletBalances',
          // ExploreStatsService (uniswap.explore.v1) — protocol TVL/volume aggregates for the Terminal
          // Landing hero + Analytics. USD figures auto-populate once the WETH/USDG anchor pool is ingested.
          'exploreStats.protocolStats',
          'exploreStats.exploreStats',
        ],
        // listTokens/listTopPools return live on-chain pools/tokens plus real NATIVE-denominated metrics
        // (priceChange1d, priceHistory1d) from the event indexer. USD-denominated fields (price, tvl,
        // volume, apr) populate only once a stablecoin (USDG) anchor pool exists — otherwise left unset.
        stubbed:
          'remaining DataApiService methods (charts, rewards, protocol stats, token prices, ...) — need higher-level time-series / protocol-stats endpoints, not the event indexer (which is live)',
        supportedChainIds: supportedChainIds(),
      }),
    )
    return
  }

  // Normalize any upstream prefix down to the bare Connect service path before delegating. Works for
  // any package (data.v1., uniswap.explore.v1., ...); slices from the start of the matched service path.
  const match = CONNECT_SERVICE_PATH_RE.exec(url)
  if (match && match.index > 0) {
    req.url = url.slice(match.index)
  }

  rpcHandler(req, res)
})

const PORT = Number(process.env.PORT || 4092)
server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[hookswap-data-api] listening on :${PORT}  (Connect-RPC data.v1.DataApiService; /health for status)`)

  // Event indexer — OFF unless explicitly enabled. When on, it tails Swap/Sync logs into the SQLite
  // store (see ./indexer). listTokens/listTopPools always return live current-state pools/tokens; when
  // the indexer is on they ALSO carry real native metrics (priceChange1d, priceHistory1d) it feeds, and
  // USD fields (price/tvl/volume/apr) once a stablecoin anchor pool exists. When off, those stats are
  // simply omitted (honest "—") and the core current-state data is unaffected.
  if (process.env.INDEXER_ENABLED === 'true') {
    const intervalMs = Number(process.env.INDEXER_INTERVAL_MS || 60_000)
    // eslint-disable-next-line no-console
    console.log(`[hookswap-data-api] event indexer ENABLED (tail interval ${intervalMs}ms; DB ${process.env.INDEXER_DB_PATH || './indexer.db'})`)
    startIngestLoop(intervalMs)
  } else {
    // eslint-disable-next-line no-console
    console.log('[hookswap-data-api] event indexer DISABLED (set INDEXER_ENABLED=true to backfill/tail Swap/Sync events)')
  }
})

export { server }
