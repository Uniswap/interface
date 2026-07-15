/**
 * Express host for the HookSwap Trading API adapter.
 *
 * Mounts the endpoints under BOTH `/v1/*` and `/*` because the interface prefixes paths with
 * `/v1` by default (TradingApiClient getApiPathPrefix => '/v1') but uses '' when
 * tradingApiWebTestEnv==='true'. Point the interface's TRADING_API_URL_OVERRIDE at this host's
 * origin (no trailing /v1) and it will hit /v1/quote etc.
 *
 * Run: `npm run dev` (ts-node) or `npm run build && npm start`.
 * CORS: allows the configured web origin so the browser app can call it directly.
 */

import express, { NextFunction, Request, Response } from 'express'
import {
  handleCheckApproval,
  handleHealth,
  handleIndicativeQuote,
  handleQuote,
  handleSwap,
  handleSwappableTokens,
} from './handlers'
import { ApprovalRequest, CreateSwapRequest, QuoteRequest } from './tradingApiTypes'

const app = express()
app.use(express.json({ limit: '1mb' }))

// --- CORS (the interface calls this from the browser) ---
// The interface's web trading client fetches with `credentials: 'include'`
// (createTradingApiFetchClient => defaultOptions.credentials='include'), so the browser
// enforces credentialed-CORS rules: it DISCARDS the response body (even on a 200) unless
// `Access-Control-Allow-Credentials: true` is present AND `Access-Control-Allow-Origin` is a
// specific origin (never `*`). Without both, every quote request silently fails in-browser
// (server logs 200, interface's fetch rejects) and the swap ticket is stuck on "Fetching…".
// Strict allowlist: comma-separated exact origins from CORS_ALLOW_ORIGIN
// (e.g. "https://hookswap.org,http://localhost:3000"). We NEVER reflect an arbitrary
// Origin with credentials — that would let any site make credentialed requests here.
// A request Origin is echoed (with Access-Control-Allow-Credentials) ONLY if it's an
// exact member of the allowlist; otherwise no ACAO/ACAC is sent (browser blocks it).
// The literal "*" is allowed for non-credentialed public access, but ACAC is then omitted
// (credentials + `*` is invalid per spec anyway).
const CORS_ALLOWLIST = new Set(
  (process.env.CORS_ALLOW_ORIGIN || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
)
const CORS_WILDCARD = CORS_ALLOWLIST.has('*')
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestOrigin = req.headers.origin
  // Always Vary on Origin so a cache/proxy can't serve one origin's ACAO to another.
  res.header('Vary', 'Origin')
  if (requestOrigin && CORS_ALLOWLIST.has(requestOrigin)) {
    // Exact-match allowlisted browser origin → echo it + allow credentials.
    res.header('Access-Control-Allow-Origin', requestOrigin)
    res.header('Access-Control-Allow-Credentials', 'true')
  } else if (CORS_WILDCARD) {
    // Public, non-credentialed access. ACAC intentionally omitted (invalid with `*`).
    res.header('Access-Control-Allow-Origin', '*')
  }
  // else: origin not allowlisted → send no ACAO/ACAC; the browser blocks the response.
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  // Reflect exactly the headers the browser's preflight asks to send. The interface keeps
  // adding new x-* trading headers over time (e.g. x-uniroute-pulumi-enabled) and any static
  // allowlist goes stale — one unknown header makes the whole preflight fail and every quote
  // silently dies in-browser. Echoing Access-Control-Request-Headers is the robust equivalent
  // and is safe because Access-Control-Allow-Origin above is already a strict exact-origin match
  // (never `*`) — so only allowlisted origins can send these headers with credentials at all.
  const requestedHeaders = req.headers['access-control-request-headers']
  res.header(
    'Access-Control-Allow-Headers',
    typeof requestedHeaders === 'string' && requestedHeaders.length > 0
      ? requestedHeaders
      : // Fallback for non-preflight or header-less requests: the known interface trading headers.
        'content-type,x-api-key,x-universal-router-version,x-request-source,x-app-version,' +
          'x-uniquote-enabled,x-viem-provider-enabled,x-erc20eth-enabled,x-universal-router-swapsteps',
  )
  if (req.method === 'OPTIONS') {
    res.sendStatus(204)
    return
  }
  next()
})

function mount(prefix: string): void {
  app.get(`${prefix}/swappable_tokens`, (req: Request, res: Response) => {
    const result = handleSwappableTokens({
      tokenIn: req.query.tokenIn as string | undefined,
      tokenInChainId: req.query.tokenInChainId as string | undefined,
    })
    res.status(result.status).json(result.body)
  })

  app.post(`${prefix}/quote`, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await handleQuote(req.body as QuoteRequest)
      res.status(result.status).json(result.body)
    } catch (e) {
      next(e)
    }
  })

  // Indicative quote: a FASTEST-preference quote for the "Fetching best price…" display.
  // Same real routing + same QuoteResponse shape as /quote (the interface's fetchIndicativeQuote
  // consumes the identical DiscriminatedQuoteResponse).
  app.post(`${prefix}/indicative_quote`, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await handleIndicativeQuote(req.body as QuoteRequest)
      res.status(result.status).json(result.body)
    } catch (e) {
      next(e)
    }
  })

  app.post(`${prefix}/swap`, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await handleSwap(req.body as CreateSwapRequest)
      res.status(result.status).json(result.body)
    } catch (e) {
      next(e)
    }
  })

  // Permit2/ERC20 allowance check before a swap (reads real on-chain allowance).
  app.post(`${prefix}/check_approval`, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await handleCheckApproval(req.body as ApprovalRequest)
      res.status(result.status).json(result.body)
    } catch (e) {
      next(e)
    }
  })
}

// Default interface prefix is '/v1'; also mount bare for tradingApiWebTestEnv mode.
mount('/v1')
mount('')

app.get('/health', (_req: Request, res: Response) => {
  const result = handleHealth()
  res.status(result.status).json(result.body)
})

// Any unmatched path → Trading-API-shaped JSON 404 (never an HTML page). A stray HTML body
// breaks the interface's fetch with "Unexpected token '<'"; keeping errors JSON avoids that.
app.use((req: Request, res: Response) => {
  res.status(404).json({ errorCode: 'NOT_FOUND', detail: `No such endpoint: ${req.method} ${req.path}` })
})

// Final error handler: any thrown/rejected handler error becomes a JSON 500, not Express's
// default HTML error page. (Signature MUST take 4 args for Express to treat it as an error mw.)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  // eslint-disable-next-line no-console
  console.error('[hookswap-trading-api-adapter] unhandled error:', error)
  res.status(500).json({ errorCode: 'INTERNAL_ERROR', detail: error?.message ?? 'Unhandled error' })
})

const PORT = Number(process.env.PORT || 4000)
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[hookswap-trading-api-adapter] listening on :${PORT}  (routing mode reported at /health)`)
})

export { app }
