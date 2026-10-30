/**
 * Returns `url` only if Satori (`@vercel/og`) can load it as an image source, else `undefined`.
 *
 * Satori throws on anything other than an absolute http(s) URL (e.g. `ipfs://`), and it throws inside
 * the `ImageResponse` stream after the 200 headers are sent, so the caller gets a zero-byte PNG.
 *
 * The result is the normalized href with `(`, `)` and `'` percent-encoded, because callers interpolate
 * it into an unquoted CSS `url(...)`.
 */
export function getSatoriImageUrl(url?: string): string | undefined {
  if (!url) {
    return undefined
  }
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return undefined
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return undefined
  }
  // ImageResponse cannot handle webp images: https://github.com/vercel/satori/issues/273#issuecomment-1296323042
  // TODO: remove this check once @vercel/og supports webp, which appears to be in-progress https://github.com/vercel/satori/pull/622
  // Check the path and the query (e.g. an image proxy's `?url=…/logo.webp`), but not the host.
  if (parsed.pathname.toLowerCase().includes('.webp') || parsed.search.toLowerCase().includes('.webp')) {
    return undefined
  }
  return parsed.href.replace(/[()']/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`)
}
