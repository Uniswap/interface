import { isBrowserRouterEnabled } from 'utils/env'

/**
 * Get the correct href for internal links based on router type.
 * When using HashRouter (production non-domain builds), adds '#' prefix.
 * When using BrowserRouter (domain builds or local dev), returns path as-is.
 *
 * @param path - Internal path (e.g., '/pools/fewV2/find')
 * @returns Path with '#' prefix if using HashRouter, otherwise path as-is
 */
export function getInternalLinkHref(path: string): string {
  if (isBrowserRouterEnabled()) {
    return path
  }
  // HashRouter requires '#' prefix
  return `#${path}`
}
