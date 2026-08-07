import { readFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { createApp, ENTRY_GATEWAY_URLS, WEBSOCKET_URLS } from 'functions/app'
import { FRAME_PROTECTION_HEADERS } from 'functions/frameProtection'
import { Hono } from 'hono'
import { compress } from 'hono/compress'

// functions/utils/cache.ts needs the Web Cache API; bun/node have no global `caches`.
if (typeof globalThis.caches === 'undefined') {
  const MAX_ENTRIES = 1000
  const entries = new Map<string, { body: string; expiresAt: number }>()
  const cache = {
    match: async (request: string): Promise<Response | undefined> => {
      const hit = entries.get(request)
      if (!hit) {
        return undefined
      }
      if (hit.expiresAt < Date.now()) {
        entries.delete(request)
        return undefined
      }
      return new Response(hit.body)
    },
    // Consumes `response`'s body — callers must not reuse the response after put().
    put: async (request: string, response: Response): Promise<void> => {
      const maxAge = /max-age=(\d+)/.exec(response.headers.get('Cache-Control') ?? '')?.[1]
      if (!maxAge) {
        return
      }
      const expiresAt = Date.now() + Number(maxAge) * 1000
      if (entries.size >= MAX_ENTRIES) {
        const oldest = entries.keys().next().value
        if (oldest !== undefined) {
          entries.delete(oldest)
        }
      }
      entries.set(request, { body: await response.text(), expiresAt })
    },
  }
  ;(globalThis as unknown as { caches: { open: () => Promise<typeof cache> } }).caches = {
    open: async () => cache,
  }
}

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

// Response BodyInit needs a Uint8Array; a Node Buffer is not one.
const assetCache = new Map<string, Promise<Uint8Array<ArrayBuffer>>>()
function readAsset(path: string): Promise<Uint8Array<ArrayBuffer>> {
  let cached = assetCache.get(path)
  if (!cached) {
    cached = readFile(path)
      .then((buf) => {
        const bytes = new Uint8Array(buf.byteLength)
        bytes.set(buf)
        return bytes
      })
      .catch((error: unknown) => {
        assetCache.delete(path)
        throw error
      })
    assetCache.set(path, cached)
  }
  return cached
}

// Disk-backed stand-in for the Cloudflare Workers ASSETS binding (createApp's getFont).
const assets: { fetch: (input: RequestInfo | URL) => Promise<Response> } = {
  fetch: async (input) => {
    const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const pathname = new URL(urlStr).pathname
    try {
      const data = await readAsset(join(CLIENT_DIR, pathname))
      return new Response(data)
    } catch {
      return new Response(null, { status: 404 })
    }
  },
}

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
        // Mirrors public/_headers /index.html.
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
  // ── Trusted client IP ──────────────────────────────────────────────────
  // A header is trustworthy ONLY if the proxy directly in front of this origin
  // sets/overwrites it AND the backend ALB security group makes that proxy the
  // sole reachable path. Clients can send any header, so we never trust one a
  // client can forge. (Dropped the old x-real-ip fallback: nothing on the
  // ECS/ALB path sets it — it's a Vercel/nginx header — so on ECS it could only
  // ever be client-supplied and spoofable.)
  //
  //   • cf-connecting-ip          — set + overwritten by Cloudflare (today's
  //                                 front door). Authoritative while Cloudflare
  //                                 fronts the ALB.
  //   • CloudFront-Viewer-Address — "IP:port"; set by CloudFront, which also
  //                                 strips client-sent CloudFront-* headers.
  //                                 Authoritative once CloudFront is the front
  //                                 door. Needs the CloudFront origin-request
  //                                 policy that forwards this header.
  //   • x-forwarded-for RIGHTMOST — best-effort last resort when NO proxy
  //                                 header is present (a direct ALB hit; possible
  //                                 in dev/staging where the SG is open). The ALB
  //                                 appends the real TCP source as the LAST entry
  //                                 and a client can't forge what the ALB appends.
  //                                 Never the leftmost ([0]) — that is
  //                                 client-controlled and spoofable.
  //
  // ███████████████████████████████████████████████████████████████████████████
  // ██ 🚨🚨🚨  DELETE THE cf-connecting-ip BRANCH AT THE CLOUDFRONT CUTOVER 🚨🚨🚨
  // ██
  // ██ CloudFront does NOT set OR strip cf-connecting-ip. The moment CloudFront
  // ██ can reach the ALB, ANY client can send `cf-connecting-ip: <spoofed>` and
  // ██ — because it is checked FIRST — it will be trusted, reopening the exact
  // ██ spoofing hole this ordering closes while Cloudflare is still in front.
  // ██ After cutover, trust ONLY CloudFront-Viewer-Address (and drop
  // ██ Cloudflare's IP ranges from the backend ALB security group).
  // ██
  // ██ This ordered chain assumes a CLEAN cutover. Avoid a long dual-proxy
  // ██ overlap: during overlap, CloudFront traffic can still forge
  // ██ cf-connecting-ip. If overlap is unavoidable, route CloudFront to its own
  // ██ listener/target group that reads only CloudFront-Viewer-Address.
  // ███████████████████████████████████████████████████████████████████████████
  getTrustedClientIp: (c) => {
    const cfConnectingIp = c.req.header('cf-connecting-ip')
    if (cfConnectingIp) {
      return cfConnectingIp
    }
    // "IP:port" for both IPv4 and IPv6 — the port is always after the final colon.
    const cfViewerAddress = c.req.header('cloudfront-viewer-address')
    if (cfViewerAddress) {
      const portColon = cfViewerAddress.lastIndexOf(':')
      return portColon === -1 ? cfViewerAddress : cfViewerAddress.slice(0, portColon)
    }
    // No trusted proxy header: fall back to the ALB-appended (rightmost) XFF
    // entry — the immediate TCP peer. Best-effort; not proxy-vouched.
    const xff = c.req.header('x-forwarded-for')
    if (xff) {
      return xff.split(',').at(-1)?.trim() || undefined
    }
    return undefined
  },
})

// *.map is never served — hidden sourcemaps ship in build/client for Datadog only.
const STATIC_FILE = /\.[a-z0-9]+$/i
const HTML_FILE = /\.html?$/i
const SOURCEMAP_FILE = /\.map$/i
// Served as real files, not the SPA shell, even when extensionless (e.g.
// apple-app-site-association) — otherwise iOS/Android app-association breaks.
const WELL_KNOWN = /^\/\.well-known\//
// Mirrors public/_headers.
const IMMUTABLE_ASSET = /^\/(?:assets|fonts|static)\/|^\/favicon\.ico$/i

const staticHandler = serveStatic({
  root: CLIENT_DIR,
  onFound: (_path, c) => {
    const pathname = new URL(c.req.url).pathname
    c.header(
      'Cache-Control',
      IMMUTABLE_ASSET.test(pathname) ? 'public, max-age=31536000, immutable' : 'public, max-age=3600',
    )
    // serveStatic defaults extensionless files to octet-stream; the only such
    // well-known doc (apple-app-site-association) is JSON.
    if (WELL_KNOWN.test(pathname) && !STATIC_FILE.test(pathname)) {
      c.header('Content-Type', 'application/json')
    }
  },
})

const htmlStaticHandler = serveStatic({
  root: CLIENT_DIR,
  onFound: (_path, c) => {
    for (const [name, value] of Object.entries(FRAME_PROTECTION_HEADERS)) {
      c.header(name, value)
    }
  },
})

const root = new Hono()
// Register /health before compress() so the every-few-seconds ALB probe isn't gzipped.
root.get('/health', (c) => c.text('ok'))
root.use('*', compress())
// compress() sets Content-Encoding but no Vary, so a shared cache could hand a
// gzip body to an identity client. Key every compressible response on the header.
root.use('*', async (c, next) => {
  await next()
  c.header('Vary', 'Accept-Encoding', { append: true })
})
root.use('*', (c, next) => {
  const isStaticMethod = c.req.method === 'GET' || c.req.method === 'HEAD'
  const pathname = new URL(c.req.url).pathname
  const isStaticPath = STATIC_FILE.test(pathname) || WELL_KNOWN.test(pathname)
  if (!isStaticMethod || !isStaticPath || SOURCEMAP_FILE.test(pathname)) {
    return next()
  }
  if (HTML_FILE.test(pathname)) {
    return pathname === '/index.html' ? next() : htmlStaticHandler(c, next)
  }
  return staticHandler(c, next)
})
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
