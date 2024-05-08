// Copied from https://github.com/Uniswap/interface/blob/main/src/utils/uriToHttp.ts

/**
 * Given a URI that may be ipfs, ipns, http, or https protocol, return the fetch-able http(s) URLs for the same content
 * @param uri to convert to fetch-able http url
 */
export function uriToHttp(uri: string): string[] {
  if (!uri) {
    return []
  }

  const protocol = uri.split(':')[0]?.toLowerCase()
  if (protocol === 'https') {
    return [uri]
  }
  if (protocol === 'http') {
    return ['https' + uri.slice(4), uri]
  }
  if (protocol === 'ipfs') {
    const hash = uri.match(/^ipfs:(\/\/)?(ipfs\/)?(.*)$/i)?.[3]
    return [`https://cloudflare-ipfs.com/ipfs/${hash}`, `https://ipfs.io/ipfs/${hash}`]
  }
  if (protocol === 'ipns') {
    const name = uri.match(/^ipns:(\/\/)?(.*)$/i)?.[2]
    return [`https://cloudflare-ipfs.com/ipns/${name}`, `https://ipfs.io/ipns/${name}`]
  }

  return []
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
