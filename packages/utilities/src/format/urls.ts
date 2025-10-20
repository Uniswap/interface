import { logger } from 'utilities/src/logger/logger'

/**
 * Given a URI that may be ipfs, ipns, http, https, ar, or data protocol, return the fetch-able http(s) URLs for the same content
 * @param uri to convert to fetch-able http url
 */
export function uriToHttpUrls(uri: string, options?: { allowLocalUri?: boolean }): string[] {
  const protocol = uri.split(':')[0]?.toLowerCase()

  switch (protocol) {
    case uri: {
      // If the result of protocol equals the uri, it means the uri has no protocol and is a local file (ie. a relative or absolute path).
      return options?.allowLocalUri ? [uri] : []
    }
    case 'data':
      return [uri]
    case 'https':
      return [uri]
    case 'http':
      // In extensions, prioritize HTTP for localhost since HTTPS localhost doesn't work
      if (typeof process !== 'undefined' && process.env.IS_UNISWAP_EXTENSION === 'true' && uri.includes('localhost')) {
        return [uri, 'https' + uri.slice(4)]
      }
      return ['https' + uri.slice(4), uri]
    case 'ipfs': {
      const hash = uri.match(/^ipfs:(\/\/)?(ipfs\/)?(.*)$/i)?.[3]
      return [`https://ipfs.io/ipfs/${hash}/`, `https://hardbin.com/ipfs/${hash}/`]
    }
    case 'ipns': {
      const name = uri.match(/^ipns:(\/\/)?(.*)$/i)?.[2]
      return [`https://ipfs.io/ipns/${name}/`, `https://hardbin.com/ipns/${name}/`]
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

function parseUrl(url?: string): URL | undefined {
  if (!url) {
    return undefined
  }

  try {
    return new URL(url)
  } catch (error) {
    logger.error(error, {
      tags: { file: 'format/urls', function: 'parseUrl' },
      extra: { url },
    })
    return undefined
  }
}

/**
 * Formats the app url by only returning the host url. If the url is not
 * secure, the base url is shown instead. If the url is not a valid url, the
 * a shortened version of the invalid string is shown instead.
 *
 * See tests for examples.
 */
export function formatDappURL(url: string): string {
  return parseUrl(url)?.origin.replace('https://', '') ?? url.slice(0, 20)
}

/** Returns the url host (doesn't include http or https) */
export function extractUrlHost(url?: string): string | undefined {
  return parseUrl(url)?.host
}

/** Returns the url origin (includes http or https) */
export function extractBaseUrl(url?: string): string | undefined {
  return parseUrl(url)?.origin
}
