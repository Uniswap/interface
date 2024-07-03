/**
 * Given a URI that may be ipfs, ipns, http, https, ar, or data protocol, return the fetch-able http(s) URLs for the same content
 * @param uri to convert to fetch-able http url
 */
export function uriToHttpUrls(uri: string): string[] {
  const protocol = uri.split(':')[0]?.toLowerCase()
  switch (protocol) {
    case 'data':
      return [uri]
    case 'https':
      return [uri]
    case 'http':
      return ['https' + uri.slice(4), uri]
    case 'ipfs': {
      const hash = uri.match(/^ipfs:(\/\/)?(ipfs\/)?(.*)$/i)?.[3]
      return [`https://cloudflare-ipfs.com/ipfs/${hash}/`, `https://ipfs.io/ipfs/${hash}/`]
    }
    case 'ipns': {
      const name = uri.match(/^ipns:(\/\/)?(.*)$/i)?.[2]
      return [`https://cloudflare-ipfs.com/ipns/${name}/`, `https://ipfs.io/ipns/${name}/`]
    }
    case 'ar': {
      const tx = uri.match(/^ar:(\/\/)?(.*)$/i)?.[2]
      return [`https://arweave.net/${tx}`]
    }
    default:
      return []
  }
}

export function isSegmentUri(uri: Maybe<string>, extension: string): boolean {
  if (typeof uri !== 'string' || !uri.trim()) {
    return false
  }

  try {
    // Validate URI structure by checking for presence of scheme
    if (!/^https?:\/\/.+/i.test(uri)) {
      return false
    }

    const url = new URL(uri)
    const pathname = url.pathname

    // Check if pathname ends with an '.svg' (or other) extension, case-insensitive
    return pathname.toLowerCase().endsWith(extension)
  } catch {
    // URI parsing failed, indicating an invalid URI
    return false
  }
}

/**
 * Checks if the provided URI points to an SVG file.
 *
 * This examines the path of a URI to determine if it ends with an ".svg" extension,
 * accounting for potential query parameters or anchors. The check is case-insensitive.
 *
 * @param {Maybe<string>} uri The URI to check.
 * @returns {boolean} True if the URI points to an SVG file, false otherwise.
 */
export function isSVGUri(uri: Maybe<string>): boolean {
  return isSegmentUri(uri, '.svg')
}

/**
 * Checks if the provided URI points to a GIF file.
 *
 * This examines the path of a URI to determine if it ends with an ".gif" extension,
 * accounting for potential query parameters or anchors. The check is case-insensitive.
 *
 * @param {Maybe<string>} uri The URI to check.
 * @returns {boolean} True if the URI points to an GIF file, false otherwise.
 */
export function isGifUri(uri: Maybe<string>): boolean {
  return isSegmentUri(uri, '.gif')
}

/**
 * Removes safe prefixes and trailing slashes from URL to improve human readability.
 *
 * @param {string} url The URL to check.
 */
export function formatDappURL(url: string): string {
  return url?.replace('https://', '').replace('www.', '').replace(/\/$/, '')
}
