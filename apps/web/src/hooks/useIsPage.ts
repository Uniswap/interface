import { useLocation } from 'react-router-dom'

export enum PageType {
  BUY = '/buy',
  EXPLORE = '/explore',
  LANDING = '/',
  LIMIT = '/limit',
  MIGRATE_V3 = '/migrate/v3',
  NFTS = '/nfts',
  NFTS_DETAILS = '/nfts/asset',
  NFTS_PROFILE = '/nfts/profile',
  POSITIONS = '/positions',
  SEND = '/send',
  SWAP = '/swap',
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
  [PageType.NFTS]: MatchType.STARTS_WITH,
  [PageType.NFTS_DETAILS]: MatchType.STARTS_WITH,
  [PageType.NFTS_PROFILE]: MatchType.STARTS_WITH,
  [PageType.POSITIONS]: MatchType.INCLUDES,
  [PageType.SEND]: MatchType.ENDS_WITH,
  [PageType.SWAP]: MatchType.ENDS_WITH,
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
