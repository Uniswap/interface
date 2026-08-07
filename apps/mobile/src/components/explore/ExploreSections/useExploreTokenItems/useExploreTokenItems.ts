import { useMemo } from 'react'
import { EXPLORE_LIST_TOKENS_V2_PAGE_SIZE } from 'src/components/explore/ExploreSections/exploreListItems'
import {
  ExploreTokenItemsResult,
  TokenItemDataWithMetadata,
  getTokenMetadataDisplayTypeSafe,
} from 'src/components/explore/ExploreSections/useExploreTokenItems/shared'
import { rankedMultichainTokenToTokenItemData } from 'src/components/explore/rankedMultichainTokenToTokenItemData'
import { exploreOrderByToV2Sort } from 'src/features/explore/utils'
import { useExploreListTokens } from 'uniswap/src/data/apiClients/dataApiService/explore/useExploreListTokens'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ExploreOrderBy } from 'wallet/src/features/wallet/types'

/**
 * v2 ListTokens — single sort per request; switching orderBy triggers a fresh, paginated fetch.
 * The canonical implementation once V1 (TokenRankings) is removed.
 */
export function useExploreTokenItems({
  selectedNetwork,
  orderBy,
  skip,
}: {
  selectedNetwork: UniverseChainId | null
  orderBy: ExploreOrderBy
  skip: boolean
}): ExploreTokenItemsResult {
  const { chains: enabledChainIds } = useEnabledChains()
  const chainIds = useMemo(
    () => (selectedNetwork !== null ? [selectedNetwork] : enabledChainIds),
    [selectedNetwork, enabledChainIds],
  )
  const { orderBy: v2OrderBy, ascending } = exploreOrderByToV2Sort(orderBy)
  const tokenMetadataDisplayType = getTokenMetadataDisplayTypeSafe(orderBy)

  const { multichainTokens, hasData, isLoading, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useExploreListTokens({
      chainIds,
      orderBy: v2OrderBy,
      ascending,
      pageSize: EXPLORE_LIST_TOKENS_V2_PAGE_SIZE,
      enabled: !skip,
    })

  const topTokenItems = useMemo(() => {
    if (tokenMetadataDisplayType === null) {
      return []
    }
    const processedTokens: TokenItemDataWithMetadata[] = []
    for (const token of multichainTokens) {
      const tokenItemData = rankedMultichainTokenToTokenItemData(token, selectedNetwork)
      if (tokenItemData) {
        processedTokens.push({ tokenItemData, tokenMetadataDisplayType })
      }
    }
    return processedTokens
  }, [multichainTokens, tokenMetadataDisplayType, selectedNetwork])

  return {
    topTokenItems,
    hasData,
    isLoading,
    error,
    refetch,
    isFetching: isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  }
}
