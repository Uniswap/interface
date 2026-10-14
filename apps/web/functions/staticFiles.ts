import { serveStatic } from '@hono/node-server/serve-static'
import { FRAME_PROTECTION_HEADERS } from 'functions/frameProtection'
import type { Context, MiddlewareHandler, Next } from 'hono'

// *.map is never served — hidden sourcemaps ship in build/client for Datadog only.
const STATIC_FILE = /\.[a-z0-9]+$/i
const HTML_FILE = /\.html?$/i
const SOURCEMAP_FILE = /\.map$/i
// Served as real files, not the SPA shell, even when extensionless (e.g.
// apple-app-site-association) — otherwise iOS/Android app-association breaks.
const WELL_KNOWN = /^\/\.well-known\//
// Content-hashed build output: safe to cache for a year.
const IMMUTABLE_ASSET = /^\/(?:assets|fonts|static)\/|^\/favicon\.ico$/i

const IMMUTABLE_HEADERS = { 'Cache-Control': 'public, max-age=31536000, immutable' }
const DEFAULT_HEADERS = { 'Cache-Control': 'public, max-age=3600' }
// serveStatic defaults extensionless files to octet-stream; the only such well-known doc is JSON.
const WELL_KNOWN_JSON_HEADERS = { ...DEFAULT_HEADERS, 'Content-Type': 'application/json' }

// no-store: a cached 404 for a hash a sibling task does serve would break that chunk for everyone.
function missingAsset(c: Context): void {
  c.res = new Response(null, { status: 404, headers: { 'Cache-Control': 'no-store' } })
}

/** Serves `clientDir` files on GET/HEAD; everything else (and `/index.html`) falls through to the SPA handler. */
export function staticFiles(clientDir: string): MiddlewareHandler {
  const serveFile = serveStatic({ root: clientDir })

  // Set on the returned Response, not via onFound: that hook runs after the body is built, so
  // c.header() there reaches the wire only through @hono/node-server's Headers aliasing.
  async function serve(
    c: Context,
    { onMiss, headers }: { onMiss: Next; headers: Record<string, string> },
  ): Promise<Response | undefined> {
    const res = await serveFile(c, onMiss)
    // On a miss serveStatic returns whatever onMiss returned (the Context, for Hono's next).
    if (!(res instanceof Response)) {
      return undefined
    }
    for (const [name, value] of Object.entries(headers)) {
      res.headers.set(name, value)
    }
    return res
  }

  return async (c, next) => {
    const isStaticMethod = c.req.method === 'GET' || c.req.method === 'HEAD'
    const pathname = new URL(c.req.url).pathname
    const isStaticPath = STATIC_FILE.test(pathname) || WELL_KNOWN.test(pathname)
    if (!isStaticMethod || !isStaticPath) {
      return next()
    }
    // Build-output prefixes hold only hashed files, never routes: a miss is a stale or forged
    // URL and must 404, or the SPA shell gets served (and CDN-cached) under the chunk's URL.
    if (IMMUTABLE_ASSET.test(pathname)) {
      if (SOURCEMAP_FILE.test(pathname)) {
        missingAsset(c)
        return
      }
      return serve(c, { onMiss: async () => missingAsset(c), headers: IMMUTABLE_HEADERS })
    }
    if (SOURCEMAP_FILE.test(pathname)) {
      return next()
    }
    if (HTML_FILE.test(pathname)) {
      return pathname === '/index.html' ? next() : serve(c, { onMiss: next, headers: FRAME_PROTECTION_HEADERS })
    }
    const isExtensionlessWellKnown = WELL_KNOWN.test(pathname) && !STATIC_FILE.test(pathname)
    return serve(c, { onMiss: next, headers: isExtensionlessWellKnown ? WELL_KNOWN_JSON_HEADERS : DEFAULT_HEADERS })
  }
}
