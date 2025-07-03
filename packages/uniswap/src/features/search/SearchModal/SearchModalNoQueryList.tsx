import { ExploreStatsResponse, PoolStats } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useCurrencyInfosToTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/useCurrencyInfosToTokenOptions'
import { useTrendingTokensCurrencyInfos } from 'uniswap/src/components/TokenSelector/hooks/useTrendingTokensCurrencyInfos'
import { OnchainItemSection, OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { useNftSearchResultsToNftCollectionOptions } from 'uniswap/src/components/lists/items/nfts/useNftSearchResultsToNftCollectionOptions'
import { usePoolStatsToPoolOptions } from 'uniswap/src/components/lists/items/pools/usePoolStatsToPoolOptions'
import { SearchModalOption } from 'uniswap/src/components/lists/items/types'
import { useFavoriteWalletOptions } from 'uniswap/src/components/lists/items/wallets/useFavoriteWalletOptions'
import { useOnchainItemListSection } from 'uniswap/src/components/lists/utils'
import { useSearchPopularNftCollectionsQuery } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { ALL_NETWORKS_ARG } from 'uniswap/src/data/rest/base'
import { useExploreStatsQuery } from 'uniswap/src/data/rest/exploreStats'
import { GqlResult } from 'uniswap/src/data/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ClearRecentSearchesButton } from 'uniswap/src/features/search/ClearRecentSearchesButton'
import { SearchModalList, SearchModalListProps } from 'uniswap/src/features/search/SearchModal/SearchModalList'
import {
  NUMBER_OF_RESULTS_LONG,
  NUMBER_OF_RESULTS_MEDIUM,
  NUMBER_OF_RESULTS_SHORT,
} from 'uniswap/src/features/search/SearchModal/constants'
import { useRecentlySearchedOptions } from 'uniswap/src/features/search/SearchModal/hooks/useRecentlySearchedOptions'
import { SearchTab } from 'uniswap/src/features/search/SearchModal/types'
import { isMobileApp, isWeb } from 'utilities/src/platform'
import noop from 'utilities/src/react/noop'

function useSectionsForNoQuerySearch({
  chainFilter,
  activeTab,
}: {
  chainFilter: UniverseChainId | null
  activeTab: SearchTab
}): GqlResult<OnchainItemSection<SearchModalOption>[]> {
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
      enabled: isWeb && (activeTab === SearchTab.All || activeTab === SearchTab.Pools),
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

  // Load popular NFTs by top trading volume
  const skipPopularNftsQuery = isWeb || (activeTab !== SearchTab.NFTCollections && activeTab !== SearchTab.All)
  const {
    data: popularNfts,
    loading: loadingPopularNfts,
    error: popularNftsError,
  } = useSearchPopularNftCollectionsQuery({ skip: skipPopularNftsQuery })
  const popularNftOptions = useNftSearchResultsToNftCollectionOptions(popularNfts, chainFilter)
  const popularNftSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.PopularNFTCollections,
    options: popularNftOptions,
  })

  const favoriteWalletsOptions = useFavoriteWalletOptions({ skip: activeTab !== SearchTab.Wallets })
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
          error: undefined,
          refetch: noop,
        }
      case SearchTab.NFTCollections:
        return {
          data: [...(recentSearchSection ?? []), ...(popularNftSection ?? [])],
          loading: loadingPopularNfts,
          error: popularNftsError,
          refetch: noop,
        }
      default:
      case SearchTab.All:
        if (isWeb) {
          sections = [...(recentSearchSection ?? []), ...(trendingTokenSection ?? []), ...(trendingPoolSection ?? [])]
        } else {
          sections = [...(recentSearchSection ?? []), ...(trendingTokenSection ?? []), ...(popularNftSection ?? [])]
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
    loadingPopularNfts,
    loadingTokens,
    popularNftSection,
    popularNftsError,
    recentSearchSection,
    refetchPools,
    refetchTokens,
    tokensError,
    trendingPoolSection,
    trendingTokenSection,
  ])
}

interface SearchModalNoQueryListProps {
  chainFilter: UniverseChainId | null
  activeTab: SearchTab
  onSelect?: SearchModalListProps['onSelect']
}

export const SearchModalNoQueryList = memo(function _SearchModalNoQueryList({
  chainFilter,
  activeTab,
  onSelect,
}: SearchModalNoQueryListProps): JSX.Element {
  const { t } = useTranslation()

  const { data: sections, loading, error, refetch } = useSectionsForNoQuerySearch({ chainFilter, activeTab })

  return (
    <SearchModalList
      errorText={t('token.selector.search.error')}
      hasError={Boolean(error)}
      loading={loading}
      refetch={refetch}
      sections={sections}
      searchFilters={{
        searchChainFilter: chainFilter,
        searchTabFilter: activeTab,
      }}
      onSelect={onSelect}
    />
  )
})
