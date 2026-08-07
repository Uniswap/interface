import { isEmbedPath } from '~/pages/embedPaths'

// ── Frame protection ─────────────────────────────────────────────────
// frame-ancestors cannot be enforced via <meta> CSP tags (W3C spec) — it
// must be an HTTP response header. Cloudflare Workers returns responses
// with immutable headers, so we clone into a mutable Response.
// Origins allowed to iframe-embed the app. Whitelisting an embedder
// relaxes clickjacking protection for that origin — treat additions as a
// deliberate product/security tradeoff.
// A wildcard host-source does not match the apex domain, so dexscreener.com
// needs both the apex and the subdomain-wildcard entries.
const ALLOWED_FRAME_ANCESTORS = [
  "'self'",
  'https://app.safe.global',
  'https://dexscreener.com',
  'https://*.dexscreener.com',
]

// Exported so the ECS entry can apply the same headers to disk-served .html.
export const FRAME_PROTECTION_HEADERS = {
  'Content-Security-Policy': `frame-ancestors ${ALLOWED_FRAME_ANCESTORS.join(' ')}`,
  'X-Frame-Options': 'SAMEORIGIN',
} as const

export function withFrameProtection(res: Response): Response {
  const headers = new Headers(res.headers)
  for (const [name, value] of Object.entries(FRAME_PROTECTION_HEADERS)) {
    headers.set(name, value)
  }
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers })
}

// ── Embed frame policy ───────────────────────────────────────────────
// Documents under /embed carry a partner-scoped frame-ancestors policy so
// vetted third-party sites can iframe the embed surface. The client mounts the
// full app for these documents under an embedded context (see src/App.tsx);
// Send and the embedded wallet frame-bust out on use (see src/utils/isIFramed.ts).

/**
 * Parses the configured embed frame-ancestors source list into the value used
 * in the CSP directive. Returns undefined when embedding is not configured,
 * in which case callers must fall back to the strict frame policy.
 */
export function resolveEmbedFrameAncestors(configuredSourceList: string | undefined): string | undefined {
  const sourceList = configuredSourceList?.trim()
  if (!sourceList) {
    return undefined
  }
  return sourceList === '*' ? '*' : `'self' ${sourceList}`
}

export function withEmbedFrameProtection(res: Response, frameAncestors: string): Response {
  const headers = new Headers(res.headers)
  headers.set('Content-Security-Policy', `frame-ancestors ${frameAncestors}`)
  // X-Frame-Options cannot express an allowlist and would override the CSP
  // directive in browsers that honor it, so the embed surface must not set it.
  headers.delete('X-Frame-Options')
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers })
}

/**
 * Resolves the frame-protection transform to apply to a response for the given
 * request path. Documents under /embed with a configured partner allowlist get
 * the embed policy; every other route gets the strict same-origin policy.
 *
 * `getConfiguredEmbedFrameAncestors` is only invoked for embed paths, matching
 * the original short-circuit so non-embed requests never read the embed config.
 */
export function resolveFramePolicy(
  pathname: string,
  getConfiguredEmbedFrameAncestors: () => string | undefined,
): (res: Response) => Response {
  const embedFrameAncestors = isEmbedPath(pathname)
    ? resolveEmbedFrameAncestors(getConfiguredEmbedFrameAncestors())
    : undefined
  return (res: Response): Response =>
    embedFrameAncestors ? withEmbedFrameProtection(res, embedFrameAncestors) : withFrameProtection(res)
}
