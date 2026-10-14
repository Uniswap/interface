import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { serve } from '@hono/node-server'
import { createApp, ENTRY_GATEWAY_URLS, WEBSOCKET_URLS } from 'functions/app'
import { createDiskAssets } from 'functions/diskAssets'
import { requestLogger } from 'functions/requestLogger'
import { staticFiles } from 'functions/staticFiles'
import { resolveTrustedClientIp } from 'functions/trustedClientIp'
import { Hono } from 'hono'
import { compress } from 'hono/compress'

// Resolve relative to the bundle (build/server/index.mjs), not cwd.
const CLIENT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../client')
const SPA_HTML_PATH = resolve(CLIENT_DIR, 'index.html')

let spaHtmlPromise: Promise<string> | undefined
function getSpaHtml(): Promise<string> {
  spaHtmlPromise ??= readFile(SPA_HTML_PATH, 'utf-8').catch((error: unknown) => {
    spaHtmlPromise = undefined
    throw error
  })
  return spaHtmlPromise
}

const assets = createDiskAssets(CLIENT_DIR)

const DEFAULT_ENV: keyof typeof ENTRY_GATEWAY_URLS =
  process.env.DEPLOYMENT_ENV === 'production'
    ? 'production'
    : process.env.DEPLOYMENT_ENV === 'dev'
      ? 'development'
      : 'staging'

const app = createApp({
  fetchSpaHtml: async () => {
    const html = await getSpaHtml()
    return new Response(html, {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        // Browsers revalidate every load so a stale shell never points at purged chunks; the CDN holds it 60s.
        'cache-control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=30',
      },
    })
  },
  getEntryGatewayUrl: (_c, env) => {
    if (env) {
      return ENTRY_GATEWAY_URLS[env as keyof typeof ENTRY_GATEWAY_URLS]
    }
    return process.env.ENTRY_GATEWAY_API_URL || ENTRY_GATEWAY_URLS[DEFAULT_ENV]
  },
  getWebSocketUrl: () => process.env.WEBSOCKET_URL || WEBSOCKET_URLS[DEFAULT_ENV],
  getEmbedFrameAncestors: () => process.env.EMBED_FRAME_ANCESTORS,
  getTrustedClientIp: (c) => resolveTrustedClientIp((name) => c.req.header(name)),
})

const root = new Hono()
// Register /health before compress() so the every-few-seconds ALB probe isn't gzipped.
root.get('/health', (c) => c.text('ok'))

// Registered after /health so ALB probes stay out of the request log.
root.use('*', requestLogger())

root.use('*', compress())
// compress() sets Content-Encoding but no Vary, so a shared cache could hand a
// gzip body to an identity client. Key every compressible response on the header.
root.use('*', async (c, next) => {
  await next()
  c.header('Vary', 'Accept-Encoding', { append: true })
})
// Header rather than a robots.txt Disallow: a disallowed URL is never fetched, so
// crawlers would never see the noindex and could still list the URL.
if (process.env.DEPLOYMENT_ENV !== 'production') {
  root.use('*', async (c, next) => {
    await next()
    c.header('X-Robots-Tag', 'noindex, nofollow')
  })
}
root.use('*', staticFiles(CLIENT_DIR))
root.all('*', (c) => {
  const req = c.req.raw
  // @hono/node-server keys the scheme off the socket, so og:url/og:image would emit
  // http:// behind the TLS-terminating ALB; restore https from x-forwarded-proto
  // (GET/HEAD only — no body to re-forward).
  if ((req.method === 'GET' || req.method === 'HEAD') && c.req.header('x-forwarded-proto') === 'https') {
    const url = new URL(req.url)
    if (url.protocol === 'http:') {
      url.protocol = 'https:'
      return app.fetch(new Request(url, req), { ASSETS: assets })
    }
  }
  return app.fetch(req, { ASSETS: assets })
})

// Fail fast rather than silently proxy prod traffic to staging upstreams.
if (process.env.DEPLOYMENT_ENV === 'production') {
  if (!process.env.ENTRY_GATEWAY_API_URL) {
    throw new Error('[ecs-entry] ENTRY_GATEWAY_API_URL is required when DEPLOYMENT_ENV=production')
  }
  if (!process.env.WEBSOCKET_URL) {
    throw new Error('[ecs-entry] WEBSOCKET_URL is required when DEPLOYMENT_ENV=production')
  }
}

const port = Number(process.env.PORT) || 3000

// oxlint-disable-next-line no-console
console.log(`[ecs-entry] listening on :${port}`)
serve({ fetch: root.fetch, port })
