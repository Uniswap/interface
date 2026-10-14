export default async function getFont(
  origin: string,
  env: {
    ASSETS: {
      fetch: typeof fetch
    }
  },
) {
  try {
    // ASSETS resolves by pathname only; the host is a placeholder.
    const req = new Request('https://dummy.example/fonts/Inter-normal.var.ttf', {
      headers: { 'Accept-Encoding': 'identity' }, // prevent TTF → WOFF2 rewrite
    })
    const font = await env.ASSETS.fetch(req)
    if (!font.ok) {
      throw new Error('Failed to fetch font from ASSETS binding')
    }
    return font.arrayBuffer()
  } catch {
    // Fallback to fetching from the origin if the ASSETS binding is not available.
    const url = origin + '/fonts/Inter-normal.var.ttf'
    const font = await fetch(url)
    return font.arrayBuffer()
  }
}
