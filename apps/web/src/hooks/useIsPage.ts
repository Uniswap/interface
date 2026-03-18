import { useLocation } from 'react-router'

function createGetIsPage(ctx: {
  getPathname: () => string
}): (page: PageType, matchTypeOverride?: MatchType) => boolean {
  return function getIsPage(page: PageType, matchTypeOverride?: MatchType) {
    const pathname = ensureCleanedPathname(ctx.getPathname())

    // Determine the match type: override or default from the mapping
    const matchType = matchTypeOverride ?? pageMatchDefaults[page]

    switch (matchType) {
      case MatchType.EXACT:
        return pathname === page
      case MatchType.ENDS_WITH:
        return pathname.endsWith(page)
      case MatchType.INCLUDES:
        return pathname.includes(page)
      case MatchType.STARTS_WITH:
        return pathname.startsWith(page)
      default:
        return pathname === page
    }
  }
}

function ensureCleanedPathname(pathname: string) {
  // Trim trailing slashes, except for the root path
  return pathname !== '/' ? pathname.replace(/\/+$/, '') : pathname
}

export enum PageType {
  BUY = '/buy',
  EXPLORE = '/explore',
  LANDING = '/',
  LIMIT = '/limit',
  MIGRATE_V3 = '/migrate/v3',
  MIGRATE_V2 = '/migrate/v2',
  POSITIONS = '/positions',
  CREATE_POSITION = '/positions/create',
  SEND = '/send',
  SWAP = '/swap',
  SELL = '/sell',
  PORTFOLIO = '/portfolio',
}

// eslint-disable-next-line import/no-unused-modules -- currently used in a test file
export enum MatchType {
  EXACT = 0,
  STARTS_WITH = 1,
  ENDS_WITH = 2,
  INCLUDES = 3,
}

// Default mapping of PageType to MatchType
const pageMatchDefaults: Record<PageType, MatchType> = {
  [PageType.BUY]: MatchType.EXACT,
  [PageType.EXPLORE]: MatchType.INCLUDES,
  [PageType.LANDING]: MatchType.EXACT,
  [PageType.LIMIT]: MatchType.ENDS_WITH,
  [PageType.MIGRATE_V3]: MatchType.INCLUDES,
  [PageType.MIGRATE_V2]: MatchType.INCLUDES,
  [PageType.POSITIONS]: MatchType.INCLUDES,
  [PageType.CREATE_POSITION]: MatchType.INCLUDES,
  [PageType.SEND]: MatchType.ENDS_WITH,
  [PageType.SWAP]: MatchType.ENDS_WITH,
  [PageType.SELL]: MatchType.ENDS_WITH,
  [PageType.PORTFOLIO]: MatchType.INCLUDES,
}

/**
 * Custom hook to check if the current pathname matches a specified page path.
 *
 * @param {PageType} page - The page path to check (e.g., '/explore', '/nfts/profile')
 * @param {MatchType} [matchTypeOverride] - Optional match type to override the default
 * @returns {boolean} - True if the pathname matches the condition, false otherwise
 */
export function useIsPage(page: PageType, matchTypeOverride?: MatchType) {
  const { pathname } = useLocation()
  const getIsPage = createGetIsPage({ getPathname: () => pathname })
  return getIsPage(page, matchTypeOverride)
}

function getWindowPathname() {
  if (typeof window === 'undefined') {
    throw new Error(
      'getIsBrowserPage cannot be used in server-side rendering (SSR) environments. ' +
        'Use useIsPage hook instead, which works with React Router and is SSR-compatible.',
    )
  }
  return window.location.pathname
}

export const getIsBrowserPage = createGetIsPage({ getPathname: getWindowPathname })
