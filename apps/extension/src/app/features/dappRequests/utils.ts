import { logger } from 'utilities/src/logger/logger'

function parseUrl(url?: string): URL | undefined {
  if (!url) {
    return undefined
  }

  try {
    return new URL(url)
  } catch (error) {
    logger.error(error, {
      tags: { file: 'dappRequests/utils', function: 'extractBaseUrl' },
      extra: { url },
    })
  }
}

/** Returns the url host (doesn't include http or https) */
export function extractUrlHost(url?: string): string | undefined {
  return parseUrl(url)?.host
}

/** Returns the url origin (includes http or https) */
export function extractBaseUrl(url?: string): string | undefined {
  return parseUrl(url)?.origin
}
