import type { UniverseChainId } from '@universe/chains'
import { useMemo } from 'react'
import { rankedMultichainTokenToTokenItemData } from 'src/components/explore/rankedMultichainTokenToTokenItemData'
import { TokenItemData } from 'src/components/explore/TokenItemData'
import { exploreOrderByToV2Sort } from 'src/features/explore/utils'
import { getTokenMetadataDisplayType } from 'src/features/explore/utils'
import {
  EXPLORE_LIST_TOKENS_PAGE_SIZE,
  useExploreListTokens,
} from 'uniswap/src/data/apiClients/dataApiService/explore/useExploreListTokens'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { ExploreOrderBy, TokenMetadataDisplayType } from 'wallet/src/features/wallet/types'

export type TokenItemDataWithMetadata = {
  tokenItemData: TokenItemData
  tokenMetadataDisplayType: TokenMetadataDisplayType
}

export type ExploreTokenItemsResult = {
  topTokenItems: TokenItemDataWithMetadata[]
  hasData: boolean
  isLoading: boolean
  error: Error | null
  refetch: () => unknown
  isFetching: boolean
  fetchNextPage: () => void
  hasNextPage: boolean
}

export function useExploreTokenItems({
  selectedNetwork,
  orderBy,
  categoryId,
  pageSize = EXPLORE_LIST_TOKENS_PAGE_SIZE,
  skip,
}: {
  selectedNetwork: UniverseChainId | null
  orderBy: ExploreOrderBy
  categoryId?: string
  pageSize?: number
  skip?: boolean
}): ExploreTokenItemsResult {
  const { chains: enabledChainIds } = useEnabledChains()
  const chainIds = useMemo(
    () => (selectedNetwork !== null ? [selectedNetwork] : enabledChainIds),
    [selectedNetwork, enabledChainIds],
  )
  const { orderBy: v2OrderBy, ascending } = exploreOrderByToV2Sort(orderBy)
  const tokenMetadataDisplayType = getTokenMetadataDisplayType(orderBy)

  const { multichainTokens, hasData, isLoading, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useExploreListTokens({
      chainIds,
      orderBy: v2OrderBy,
      ascending,
      pageSize,
      categoryId,
      enabled: !skip,
    })

  const topTokenItems = useMemo(() => {
    if (tokenMetadataDisplayType === null) {
      return []
    }
    const processedTokens: TokenItemDataWithMetadata[] = []
    for (const token of multichainTokens) {
      const tokenItemData = rankedMultichainTokenToTokenItemData({
        rankedToken: token,
        selectedNetwork,
        enabledChainIds,
      })
      if (tokenItemData) {
        processedTokens.push({ tokenItemData, tokenMetadataDisplayType })
      }
    }
    return processedTokens
  }, [multichainTokens, tokenMetadataDisplayType, selectedNetwork, enabledChainIds])

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
