import { isExtensionApp } from '@universe/environment'
import { logger } from 'utilities/src/logger/logger'

/**
 * Given a URI that may be ipfs, ipns, http, https, ar, or data protocol, return the fetch-able http(s) URLs for the same content
 * @param uri to convert to fetch-able http url
 */
export function uriToHttpUrls(uri: string, options?: { allowLocalUri?: boolean }): string[] {
  if (uri.startsWith('/')) {
    return options?.allowLocalUri ? [uri] : []
  }
  const protocol = uri.split(':')[0]?.toLowerCase()
  switch (protocol) {
    // if uri is a path to a local file, return it only if allowed
    case 'file': {
      return options?.allowLocalUri ? [uri] : []
    }
    // Object URLs from `URL.createObjectURL` — only safe to pass through when the caller opted in
    // (e.g. UniversalImage with `allowLocalUri`); otherwise reject like unknown schemes.
    case 'blob': {
      return options?.allowLocalUri ? [uri] : []
    }
    case 'data':
      return [uri]
    case 'https':
      return [uri]
    case 'http':
      // In extensions, prioritize HTTP for localhost since HTTPS localhost doesn't work
      if (isExtensionApp && uri.includes('localhost')) {
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
      // If protocol equals the full uri, there's no ':' separator — it's a bare path (e.g. "eth-logo.png").
      // Treat it like a local file URI.
      if (protocol === uri) {
        return options?.allowLocalUri ? [uri] : []
      }
      return []
  }
}

function matchesProtocol({
  uri,
  allowedProtocols,
  callerName,
}: {
  uri: Maybe<string>
  allowedProtocols: readonly string[]
  callerName: string
}): boolean {
  if (typeof uri !== 'string' || !uri.trim()) {
    return false
  }

  try {
    return allowedProtocols.includes(new URL(uri).protocol)
  } catch {
    logger.warn('format/urls', callerName, 'Invalid URI', { uri })
    return false
  }
}

/**
 * Checks if the provided URI uses HTTP or HTTPS protocol.
 *
 * @param {Maybe<string>} uri The URI to check.
 * @returns {boolean} True if the URI uses http:// or https://, false otherwise.
 */
export function isHttpUri(uri: Maybe<string>): boolean {
  return matchesProtocol({ uri, allowedProtocols: ['http:', 'https:'], callerName: 'isHttpUri' })
}

/**
 * Checks if the provided URI uses the HTTPS protocol.
 *
 * @param {Maybe<string>} uri The URI to check.
 * @returns {boolean} True if the URI uses https://, false otherwise.
 */
export function isHttpsUri(uri: Maybe<string>): boolean {
  return matchesProtocol({ uri, allowedProtocols: ['https:'], callerName: 'isHttpsUri' })
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

/**
 * Sanitizes a URL by ensuring it uses one of the allowed protocols.
 * Returns the original URL if its scheme matches `allowedProtocols`, otherwise
 * `undefined`. Use this to reject `javascript:`, `data:`, `ipfs:`, and other
 * schemes for URLs that will be opened in a browser context or shown to users.
 *
 * @example
 *   sanitizeUrl({ url: avatarUrl, allowedProtocols: ['http:', 'https:'], callerName: 'getAvatar' })
 *   sanitizeUrl({ url: kycUrl, allowedProtocols: ['https:'], callerName: 'useTokenKYCStatus' })
 */
export function sanitizeUrl({
  url,
  allowedProtocols,
  callerName,
}: {
  url: Maybe<string>
  allowedProtocols: readonly string[]
  callerName: string
}): string | undefined {
  if (!url) {
    return undefined
  }

  // Parse + protocol-check inline so we can emit one precise log per failure
  // (`invalid URI` vs `disallowed protocol`) instead of double-logging through
  // `matchesProtocol`, which has its own `Invalid URI` warn for its callers.
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    logger.warn('format/urls', callerName, 'Rejected URL: invalid URI', { url })
    return undefined
  }

  if (!allowedProtocols.includes(parsed.protocol)) {
    logger.warn('format/urls', callerName, 'Rejected URL: disallowed protocol', {
      url,
      protocol: parsed.protocol,
      allowedProtocols,
    })
    return undefined
  }

  return url
}
