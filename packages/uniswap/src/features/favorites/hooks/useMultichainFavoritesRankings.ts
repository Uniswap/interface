import { TokensOrderBy } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { useMemo } from 'react'
import {
  EXPLORE_LIST_TOKENS_PAGE_SIZE,
  useExploreListTokens,
} from 'uniswap/src/data/apiClients/dataApiService/explore/useExploreListTokens'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import {
  buildFavoritesCanonicalLookup,
  FavoritesCanonicalLookup,
} from 'uniswap/src/features/favorites/canonicalFavoritesLookup'

type UseMultichainFavoritesRankingsResult = FavoritesCanonicalLookup & {
  /** True once the first ListTokens page has resolved, even if it came back empty. */
  hasData: boolean
}

/**
 * Shared source of truth for favorite-token canonicalization and multichain badge visibility.
 *
 * Fetches v2 ListTokens with the same parameters Explore uses in its default state — every enabled
 * chain, sorted by 1d volume, one Explore-sized page — regardless of the Explore chain filter or
 * sort the user has picked. Tanstack Query dedupes by key, so the Explore list and the favorites
 * consumers (FavoriteTokensGrid, useToggleFavoriteCallback, the migration) share one request.
 *
 * Returns empty maps when data hasn't arrived yet. Callers should fall back gracefully: keep the
 * input currencyId as-is, and show the chain badge.
 */
export function useMultichainFavoritesRankings(): UseMultichainFavoritesRankingsResult {
  const { chains: enabledChainIds } = useEnabledChains()
  const { multichainTokens, hasData } = useExploreListTokens({
    chainIds: enabledChainIds,
    orderBy: TokensOrderBy.VOLUME_1D,
    ascending: false,
    pageSize: EXPLORE_LIST_TOKENS_PAGE_SIZE,
  })

  return useMemo(() => {
    const lookup = buildFavoritesCanonicalLookup(multichainTokens)
    return { ...lookup, hasData }
  }, [multichainTokens, hasData])
}
