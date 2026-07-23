/**
 * Cookie utilities for rewriting Set-Cookie headers from the Entry Gateway proxy.
 *
 * The backend sets cookies with Domain=.uniswap.org and __Host-/__Secure- prefixes.
 * On Vercel previews (*.vercel.app) or staging domains, the browser silently drops
 * these cookies because the domain doesn't match. This causes session-based flows
 * (InitSession -> RequestChallenge) to fail with "no session id provided".
 *
 * Based on apps/dev-portal/app/lib/entry-gateway/cookie-utils.ts
 */

/**
 * Rewrites a single Set-Cookie header value for the proxy.
 *
 * Transformations:
 * 1. Strips __Host- and __Secure- prefixes from cookie names
 * 2. Removes Domain attribute (lets browser default to request origin)
 *
 * SameSite (and every other attribute) passes through untouched — cookie
 * policy is owned by entry-gateway/platform-service, not this proxy.
 * Platform-service mints session cookies `SameSite=None; Secure` so iframe
 * embeds keep their session (INC-344); overriding SameSite here would
 * silently undo that in every environment served through this proxy.
 */
export function rewriteProxiedCookie(cookie: string): string {
  let rewritten = cookie

  // Strip __Host- and __Secure- prefixes from cookie name only.
  // Only touch the name portion (before first '=') to avoid corrupting values.
  const nameEndIndex = rewritten.indexOf('=')
  if (nameEndIndex > 0) {
    const rawName = rewritten.substring(0, nameEndIndex)
    const cookieName = rawName.replace(/^(__Host-|__Secure-)/, '')
    if (cookieName !== rawName) {
      rewritten = cookieName + rewritten.substring(nameEndIndex)
    }
  }

  // Remove Domain attribute (e.g., Domain=.uniswap.org)
  rewritten = rewritten.replace(/Domain=[^;]+;?\s?/gi, '')

  return rewritten
}

/**
 * Rewrites Set-Cookie headers on a proxied Response.
 *
 * If the response has no Set-Cookie headers, returns it unchanged.
 * Otherwise, creates a new Response with rewritten cookies.
 */
export function rewriteProxiedCookies(response: Response): Response {
  const setCookies = response.headers.getSetCookie()

  if (!setCookies.length) {
    return response
  }

  const rewritten = setCookies.map(rewriteProxiedCookie)

  // Clone the response with new headers — we need to rebuild Set-Cookie
  // since Headers.set() would collapse multiple values into one.
  const newHeaders = new Headers(response.headers)
  newHeaders.delete('Set-Cookie')
  for (const cookie of rewritten) {
    newHeaders.append('Set-Cookie', cookie)
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  })
}
