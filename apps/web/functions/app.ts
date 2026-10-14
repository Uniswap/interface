import {
  DEV_ENTRY_GATEWAY_API_BASE_URL,
  PROD_ENTRY_GATEWAY_API_BASE_URL,
  STAGING_ENTRY_GATEWAY_API_BASE_URL,
} from '@universe/api'
import { Environment } from '@universe/config'
import { auctionImageHandler } from 'functions/api/image/auctions'
import { poolImageHandler } from 'functions/api/image/pools'
import { positionImageHandler } from 'functions/api/image/positions'
import { tokenImageHandler } from 'functions/api/image/tokens'
import { metaTagInjectionMiddleware } from 'functions/components/metaTagInjector'
import { rewriteProxiedCookies } from 'functions/cookie-utils'
import { resolveFramePolicy } from 'functions/frameProtection'
import { Context, Hono } from 'hono'
import { proxy } from 'hono/proxy'

type Bindings = {
  ASSETS?: { fetch: typeof fetch } // Static-file reader supplied by the Node entry points
}

/**
 * URL segment -> upstream env. The segment values match
 * `ENTRY_GATEWAY_PROXY_ENV_SEGMENT` exported from @universe/api.
 *
 * The mapping is the proxy's only piece of "knowledge" about envs — there is
 * no feature registry, just a path-segment match. Callers that need to pin
 * a request to a specific env declare it at their call site (e.g.
 * `getEntryGatewayUrl({ env: Environment.Production })` produces `/entry-gateway/prod`).
 */
const ENTRY_GATEWAY_ENV_BY_SEGMENT: Record<string, Environment> = {
  dev: Environment.Development,
  staging: Environment.Staging,
  prod: Environment.Production,
}

/** Platform-specific dependencies injected by each entry point. */
interface AppConfig {
  fetchSpaHtml: (c: Context) => Promise<Response>
  /**
   * Resolves the upstream Entry Gateway URL. When `env` is provided, the
   * proxy is requesting the URL for that specific backend environment
   * regardless of the deployment default.
   */
  getEntryGatewayUrl: (c: Context, env?: Environment) => string
  getWebSocketUrl: (c: Context) => string
  getTrustedClientIp: (c: Context) => string | undefined
  /**
   * Space-separated CSP source list allowed to frame documents under
   * /embed, e.g. `https://partner.com https://*.partner.com`. The literal
   * `*` opens the embed surface to any ancestor. Empty/undefined keeps the
   * embed surface on the same strict frame policy as every other route.
   */
  getEmbedFrameAncestors: (c: Context) => string | undefined
}

// ── Shared constants ─────────────────────────────────────────────────
export const ENTRY_GATEWAY_URLS = {
  development: DEV_ENTRY_GATEWAY_API_BASE_URL,
  staging: STAGING_ENTRY_GATEWAY_API_BASE_URL,
  production: PROD_ENTRY_GATEWAY_API_BASE_URL,
} as const

// Statsig proxy via Cloudflare gateway — the URL is constant for the web app
// (platform prefix "interface", service prefix "gating")
const STATSIG_PROXY_TARGET = 'https://gating.interface.gateway.uniswap.org'

// Drops edge hop headers before re-proxying: a CloudFront-backed upstream 403s requests
// that already carry a CloudFront `Via`, and x-origin-verify is our edge secret.
function upstreamHeaders(c: Context): Record<string, string | undefined> {
  return {
    ...c.req.header(),
    host: undefined,
    via: undefined,
    'x-amz-cf-id': undefined,
    'x-origin-verify': undefined,
  }
}

// Development targets the staging WS host until a dev websockets deployment exists
// (keep in sync with DEV_WEBSOCKET_BASE_URL in @universe/api).
export const WEBSOCKET_URLS = {
  development: 'https://websockets.backend-staging.api.uniswap.org',
  staging: 'https://websockets.backend-staging.api.uniswap.org',
  production: 'https://websockets.backend-prod.api.uniswap.org',
} as const

export const CLIENT_IP_HEADERS = ['cf-connecting-ip', 'cloudfront-viewer-address', 'x-forwarded-for', 'x-real-ip']

// ── Cache-Control middleware for image routes ───────────────────────────
function cacheControl(maxAge: number) {
  return async (c: Context, next: () => Promise<void>) => {
    await next()
    if (c.res.ok) {
      c.res.headers.set('Cache-Control', `public, max-age=${maxAge}`)
    }
  }
}

/**
 * If the path starts with an env segment (`/prod`, `/staging`, `/dev`),
 * returns the matching upstream env and the remaining path; otherwise
 * returns `undefined` env and the original path so the deployment default
 * is used.
 */
function resolveEnvFromPath(path: string): { env: Environment | undefined; remainingPath: string } {
  const match = path.match(/^\/(prod|staging|dev)(?=\/|$)(.*)$/)
  if (!match) {
    return { env: undefined, remainingPath: path }
  }
  return { env: ENTRY_GATEWAY_ENV_BY_SEGMENT[match[1]], remainingPath: match[2] || '/' }
}

export function createApp({
  fetchSpaHtml,
  getEntryGatewayUrl,
  getWebSocketUrl,
  getTrustedClientIp,
  getEmbedFrameAncestors,
}: AppConfig) {
  const app = new Hono<{ Bindings: Bindings }>()

  // ── OG image routes ────────────────────────────────────────────────────
  app.get('/api/image/tokens/:networkName/:tokenAddress', cacheControl(604800), tokenImageHandler)

  app.get('/api/image/pools/:networkName/:poolAddress', cacheControl(604800), poolImageHandler)

  app.get('/api/image/auctions/:chainName/:auctionAddress', cacheControl(604800), auctionImageHandler)

  app.get('/api/image/positions/:version/:chainName/:identifier', cacheControl(604800), positionImageHandler)

  // ── BFF proxy: entry-gateway ─────────────────────────────────────────
  app.all('/entry-gateway/*', async (c) => {
    const initialPath = c.req.path.slice('/entry-gateway'.length) || '/'

    // Env-pinned proxy paths (e.g. `/entry-gateway/prod/<service>`) force
    // the request onto a specific backend env regardless of the deployment.
    // Used by services that have a fixed env requirement (see
    // `getEntryGatewayUrl({ env })` in @universe/api).
    const { env, remainingPath } = resolveEnvFromPath(initialPath)
    const backendUrl = getEntryGatewayUrl(c, env)
    const query = new URL(c.req.url).search

    // Forward the client IP under the header EGW reads (cf-connecting-ip), always
    // overwriting it from the platform's trusted source so clients cannot spoof it.
    const clientIp = getTrustedClientIp(c)

    const targetUrl = `${backendUrl}${remainingPath}${query}`
    // redirect:'manual' prevents SSRF via 3xx redirects to internal services
    const response = await proxy(targetUrl, {
      ...c.req,
      headers: {
        ...upstreamHeaders(c),
        ...(clientIp ? { 'cf-connecting-ip': clientIp } : {}),
      },
      redirect: 'manual',
    })

    // Rewrite Set-Cookie headers so cookies work on non-.uniswap.org domains
    // (Vercel previews, staging, etc.)
    return rewriteProxiedCookies(response)
  })

  // ── BFF proxy: config ──────────────────────────────────────────────
  app.all('/config/*', async (c) => {
    const path = c.req.path.replace(/^\/config/, '/v1/statsig-proxy')
    const query = new URL(c.req.url).search

    return proxy(`${STATSIG_PROXY_TARGET}${path}${query}`, {
      ...c.req,
      headers: upstreamHeaders(c),
      redirect: 'manual',
    })
  })

  // ── BFF proxy: WebSocket ────────────────────────────────────────────
  // In production, clients connect directly to the backend WebSocket
  // service — see getWebSocketUrl() in packages/api/src/getWebSocketUrl.ts.
  // Node's fetch() cannot upgrade a WebSocket, so the dev server proxies
  // /ws in Vite instead (vite/entry-gateway-proxy.ts).
  // Headers are stripped to avoid forwarding the local dev origin/host
  // to the backend, which would reject them.
  app.get('/ws', async (c) => {
    const wsUrl = getWebSocketUrl(c)
    const headers = new Headers(c.req.raw.headers)
    headers.delete('host')
    headers.delete('origin')
    try {
      return await fetch(wsUrl, { headers })
    } catch (err) {
      return c.text(`WebSocket proxy error: ${err}`, 502)
    }
  })

  // ── Debug: client IP discovery (non-prod only) ──────────────────────
  // Set by each bundler via scripts/debug-routes.ts. Keep the read inline:
  // hoisting it to a `const` stops the bundlers folding the block out.
  if (process.env.ENABLE_DEBUG_ROUTES === 'true') {
    app.get('/debug/my-ip-address', (c) =>
      c.text(
        [
          // `||` matches the truthiness check the proxy forwards the IP on.
          `resolved: ${getTrustedClientIp(c) || 'unknown'}`,
          // The candidates every resolver in the repo reads, so the resolved
          // value above can be attributed to one of them.
          ...CLIENT_IP_HEADERS.map((name) => `${name}: ${c.req.header(name) ?? '-'}`),
        ].join('\n'),
        200,
        { 'cache-control': 'no-store' },
      ),
    )
  }

  // ── Catch-all: SPA serving + meta tag injection ────────────────────────
  app.all('*', async (c: Context) => {
    const url = new URL(c.req.url)

    const applyFramePolicy = resolveFramePolicy(url.pathname, () => getEmbedFrameAncestors(c))

    const next = async () => {
      const response = await fetchSpaHtml(c)
      c.res = response
    }

    // API routes should not be processed by meta tag injection
    if (url.pathname.startsWith('/api/')) {
      await next()
      return applyFramePolicy(c.res)
    }

    // For non-API routes, use meta tag injection middleware
    return applyFramePolicy(await metaTagInjectionMiddleware(c, next))
  })

  return app
}
