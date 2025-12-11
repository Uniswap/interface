import { ExploreStatsResponse, PoolStats } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { ALL_NETWORKS_ARG, GqlResult } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useMemo } from 'react'
import { usePoolStatsToPoolOptions } from 'uniswap/src/components/lists/items/pools/usePoolStatsToPoolOptions'
import { SearchModalOption } from 'uniswap/src/components/lists/items/types'
import { useFavoriteWalletOptions } from 'uniswap/src/components/lists/items/wallets/useFavoriteWalletOptions'
import { OnchainItemSection, OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { useOnchainItemListSection } from 'uniswap/src/components/lists/utils'
import { useCurrencyInfosToTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/useCurrencyInfosToTokenOptions'
import { useTrendingTokensCurrencyInfos } from 'uniswap/src/components/TokenSelector/hooks/useTrendingTokensCurrencyInfos'
import { useExploreStatsQuery } from 'uniswap/src/data/rest/exploreStats'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ClearRecentSearchesButton } from 'uniswap/src/features/search/ClearRecentSearchesButton'
import {
  NUMBER_OF_RESULTS_LONG,
  NUMBER_OF_RESULTS_MEDIUM,
  NUMBER_OF_RESULTS_SHORT,
} from 'uniswap/src/features/search/SearchModal/constants'
import { useRecentlySearchedOptions } from 'uniswap/src/features/search/SearchModal/hooks/useRecentlySearchedOptions'
import { SearchTab } from 'uniswap/src/features/search/SearchModal/types'
import { isMobileApp, isWebApp, isWebPlatform } from 'utilities/src/platform'

export function useSectionsForNoQuerySearch({
  chainFilter,
  activeTab,
}: {
  chainFilter: UniverseChainId | null
  activeTab: SearchTab
}): GqlResult<OnchainItemSection<SearchModalOption>[]> {
  const viewExternalWalletsFeatureEnabled = useFeatureFlag(FeatureFlags.ViewExternalWalletsOnWeb)
  const walletSearchEnabledOnWeb = isWebApp && viewExternalWalletsFeatureEnabled

  const recentlySearchedOptions: SearchModalOption[] = useRecentlySearchedOptions({
    chainFilter,
    activeTab,
    numberOfRecentSearchResults: NUMBER_OF_RESULTS_SHORT,
  })

  const recentSearchSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.RecentSearches,
    options: recentlySearchedOptions,
    endElement: <ClearRecentSearchesButton />,
  })

  const numberOfTrendingTokens =
    activeTab === SearchTab.All
      ? isMobileApp
        ? NUMBER_OF_RESULTS_MEDIUM
        : NUMBER_OF_RESULTS_SHORT
      : NUMBER_OF_RESULTS_LONG
  const skipTrendingTokensQuery = activeTab !== SearchTab.Tokens && activeTab !== SearchTab.All
  const {
    data: tokens,
    error: tokensError,
    refetch: refetchTokens,
    loading: loadingTokens,
  } = useTrendingTokensCurrencyInfos(chainFilter, skipTrendingTokensQuery)
  const trendingTokenOptions = useCurrencyInfosToTokenOptions({ currencyInfos: tokens })
  const trendingTokenSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.TrendingTokens,
    options: trendingTokenOptions?.slice(0, numberOfTrendingTokens),
  })

  // Load trending pools by 24H volume
  const numberOfTrendingPools = activeTab === SearchTab.All ? NUMBER_OF_RESULTS_SHORT : NUMBER_OF_RESULTS_LONG
  const poolQueryVariables = useMemo(
    () => ({
      input: { chainId: chainFilter ? chainFilter.toString() : ALL_NETWORKS_ARG },
      enabled: isWebPlatform && (activeTab === SearchTab.All || activeTab === SearchTab.Pools),
      select: (data: ExploreStatsResponse): PoolStats[] | undefined =>
        data.stats?.poolStats
          .sort((a, b) => (b.volume1Day?.value ?? 0) - (a.volume1Day?.value ?? 0)) // Sort by 24h volume
          .slice(0, numberOfTrendingPools),
    }),
    [activeTab, chainFilter, numberOfTrendingPools],
  )
  const {
    data: topPools,
    isLoading: topPoolsLoading,
    error: topPoolsError,
    refetch: refetchPools,
  } = useExploreStatsQuery<PoolStats[] | undefined>(poolQueryVariables)
  const trendingPoolOptions = usePoolStatsToPoolOptions(topPools)
  const trendingPoolSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.TrendingPools,
    options: trendingPoolOptions,
  })

  const skipFavoriteWallets =
    activeTab !== SearchTab.Wallets && !(isWebApp && walletSearchEnabledOnWeb && activeTab === SearchTab.All)
  const favoriteWalletsOptions = useFavoriteWalletOptions({ skip: skipFavoriteWallets })
  const favoriteWalletsSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.FavoriteWallets,
    options: favoriteWalletsOptions,
  })

  // eslint-disable-next-line complexity
  return useMemo((): GqlResult<OnchainItemSection<SearchModalOption>[]> => {
    let sections: OnchainItemSection<SearchModalOption>[] = []

    switch (activeTab) {
      case SearchTab.Tokens:
        sections = [...(recentSearchSection ?? []), ...(trendingTokenSection ?? [])]
        return {
          data: sections,
          loading: loadingTokens,
          error: tokensError,
          refetch: refetchTokens,
        }
      case SearchTab.Pools:
        sections = [...(recentSearchSection ?? []), ...(trendingPoolSection ?? [])]
        return {
          data: sections,
          loading: topPoolsLoading || Boolean(topPools?.length && !trendingPoolOptions.length),
          error: topPoolsError ?? undefined,
          refetch: refetchPools,
        }
      case SearchTab.Wallets:
        return {
          data: [...(recentSearchSection ?? []), ...(favoriteWalletsSection ?? [])],
          loading: false,
        }
      case SearchTab.NFTCollections:
        return {
          data: [...(recentSearchSection ?? [])],
          loading: false,
        }
      default:
      case SearchTab.All:
        if (isWebPlatform) {
          const webSections = [
            ...(recentSearchSection ?? []),
            ...(trendingTokenSection ?? []),
            ...(trendingPoolSection ?? []),
          ]
          sections = walletSearchEnabledOnWeb ? [...webSections, ...(favoriteWalletsSection ?? [])] : webSections
        } else {
          sections = [...(recentSearchSection ?? []), ...(trendingTokenSection ?? [])]
        }

        return {
          data: sections,
          loading: loadingTokens,
          error: tokensError,
          refetch: refetchTokens,
        }
    }
  }, [
    activeTab,
    topPools?.length,
    trendingPoolOptions.length,
    topPoolsError,
    topPoolsLoading,
    favoriteWalletsSection,
    loadingTokens,
    recentSearchSection,
    refetchPools,
    refetchTokens,
    tokensError,
    trendingPoolSection,
    trendingTokenSection,
    walletSearchEnabledOnWeb,
  ])
}
