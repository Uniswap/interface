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
import { handleHealth, handleQuote, handleSwap, handleSwappableTokens } from './handlers'
import { CreateSwapRequest, QuoteRequest } from './tradingApiTypes'

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
  res.header(
    'Access-Control-Allow-Headers',
    // Mirror the headers the interface's trading client sets (see TradingApiClient.ts).
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

  app.post(`${prefix}/quote`, async (req: Request, res: Response) => {
    const result = await handleQuote(req.body as QuoteRequest)
    res.status(result.status).json(result.body)
  })

  app.post(`${prefix}/swap`, async (req: Request, res: Response) => {
    const result = await handleSwap(req.body as CreateSwapRequest)
    res.status(result.status).json(result.body)
  })
}

// Default interface prefix is '/v1'; also mount bare for tradingApiWebTestEnv mode.
mount('/v1')
mount('')

app.get('/health', (_req: Request, res: Response) => {
  const result = handleHealth()
  res.status(result.status).json(result.body)
})

const PORT = Number(process.env.PORT || 4000)
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[hookswap-trading-api-adapter] listening on :${PORT}  (routing mode reported at /health)`)
})

export { app }
