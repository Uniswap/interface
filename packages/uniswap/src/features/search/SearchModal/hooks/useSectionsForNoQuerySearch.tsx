import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { ExploreStatsResponse, PoolStats } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { ALL_NETWORKS_ARG, type GqlResult } from '@universe/api'
import { GatedFeature, useIsFeatureGated } from '@universe/compliance'
import { isMobileApp, isWebApp, isWebPlatform } from '@universe/environment'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TrendUp } from 'ui/src/components/icons/TrendUp'
import { usePoolStatsToPoolOptions } from 'uniswap/src/components/lists/items/pools/usePoolStatsToPoolOptions'
import type { SearchModalOption } from 'uniswap/src/components/lists/items/types'
import { useFavoriteWalletOptions } from 'uniswap/src/components/lists/items/wallets/useFavoriteWalletOptions'
import { OnchainItemSection, OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { useOnchainItemListSection } from 'uniswap/src/components/lists/utils'
import { NewTag } from 'uniswap/src/components/pill/NewTag'
import { useCurrencyInfosToTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/useCurrencyInfosToTokenOptions'
import { useMultichainSearchResultsToOptions } from 'uniswap/src/components/TokenSelector/hooks/useMultichainSearchResultsToOptions'
import { useTrendingTokensCurrencyInfos } from 'uniswap/src/components/TokenSelector/hooks/useTrendingTokensCurrencyInfos'
import { useExploreStatsQuery } from 'uniswap/src/data/rest/exploreStats'
import { useListRankedRwasQuery } from 'uniswap/src/data/rest/listRankedRwas'
import { mapRankedRwaList } from 'uniswap/src/data/rest/rwa/mapRankedRwa'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useTopAuctionOptions } from 'uniswap/src/features/dataApi/searchAuctions'
import type { MultichainSearchResult } from 'uniswap/src/features/dataApi/types'
import { ClearRecentSearchesButton } from 'uniswap/src/features/search/ClearRecentSearchesButton'
import {
  NUMBER_OF_RESULTS_LONG,
  NUMBER_OF_RESULTS_MEDIUM,
  NUMBER_OF_RESULTS_SHORT,
} from 'uniswap/src/features/search/SearchModal/constants'
import { useMultichainTrendingTokenRankings } from 'uniswap/src/features/search/SearchModal/hooks/useMultichainTrendingTokenRankings'
import { useRecentlySearchedOptions } from 'uniswap/src/features/search/SearchModal/hooks/useRecentlySearchedOptions'
import { useSearchMultichainListTokens } from 'uniswap/src/features/search/SearchModal/hooks/useSearchMultichainListTokens'
import { optionChainAddresses } from 'uniswap/src/features/search/SearchModal/stocks/applyRwaGrouping'
import { buildNoQueryRwaCollectionOptions } from 'uniswap/src/features/search/SearchModal/stocks/noQueryStocks'
import { findRwaForToken } from 'uniswap/src/features/search/SearchModal/stocks/rwaSearchGrouping'
import { tagOptionAsRwa } from 'uniswap/src/features/search/SearchModal/stocks/tagOptionAsRwa'
import { useRwaSearchIndex } from 'uniswap/src/features/search/SearchModal/stocks/useRwaSearchIndex'
import { SearchTab } from 'uniswap/src/features/search/SearchModal/types'

// Stable element identity so the stocks section memo (and the sibling memoizedNewTag) isn't busted every render.
const STOCKS_SECTION_ICON = <TrendUp color="$neutral2" size="$icon.16" />

/**
 * Trending multichain tokens for the search modal's no-query state. Uses v2 ListTokens
 * (useSearchMultichainListTokens) when FeatureFlags.V2EndpointsTokens is on, else falls back to
 * the TokenRankings-based useMultichainTrendingTokenRankings.
 */
function useMultichainTokenResults({
  pageSize,
  skip,
  isV2TokensEnabled,
}: {
  pageSize: number
  skip: boolean
  isV2TokensEnabled: boolean
}): GqlResult<MultichainSearchResult[]> {
  const tokenRankings = useMultichainTrendingTokenRankings({ pageSize, skip: skip || isV2TokensEnabled })
  const listTokens = useSearchMultichainListTokens({ pageSize, skip: skip || !isV2TokensEnabled })
  return isV2TokensEnabled ? listTokens : tokenRankings
}

export function useSectionsForNoQuerySearch({
  chainFilter,
  activeTab,
  auctionSearchEnabled = false,
}: {
  chainFilter: UniverseChainId | null
  activeTab: SearchTab
  auctionSearchEnabled?: boolean
}): GqlResult<OnchainItemSection<SearchModalOption>[]> {
  const { t } = useTranslation()
  const rwaEnabled = useFeatureFlag(FeatureFlags.RwaUxSearch)
  const isV2TokensEnabled = useFeatureFlag(FeatureFlags.V2EndpointsTokens)
  // The "Stocks by 24H volume" section renders when the parent `rwa_ux_search` flag is on and the
  // caller's region isn't RWA-blocked. Grouping/recents-tagging stay on the parent.
  const isRwaRegionBlocked = useIsFeatureGated(GatedFeature.ISSUER_SPECIFIC_RWA)
  const stocksSectionEnabled = rwaEnabled && !isRwaRegionBlocked
  const rwaIndex = useRwaSearchIndex()

  const recentlySearchedOptions: SearchModalOption[] = useRecentlySearchedOptions({
    chainFilter,
    activeTab,
    numberOfRecentSearchResults: NUMBER_OF_RESULTS_SHORT,
  })

  // Tag recently-searched tokens that are tokenized stocks so they render the category tag. Recents stay individual
  // token rows (no collection roll-up); reuse the query-state extraction + lookup so the two paths can't drift.
  const taggedRecentlySearchedOptions = useMemo(() => {
    if (!rwaEnabled || !rwaIndex.rwas.length) {
      return recentlySearchedOptions
    }
    return recentlySearchedOptions.map((option) => {
      const match = optionChainAddresses(option)
        .map((ca) => findRwaForToken(rwaIndex, ca))
        .find(Boolean)
      return match ? tagOptionAsRwa({ option, match }) : option
    })
  }, [rwaEnabled, rwaIndex, recentlySearchedOptions])

  const recentSearchSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.RecentSearches,
    options: taggedRecentlySearchedOptions,
    endElement: <ClearRecentSearchesButton />,
  })

  const isMultichainPath = chainFilter === null

  const numberOfTrendingTokens =
    activeTab === SearchTab.All
      ? isMobileApp
        ? NUMBER_OF_RESULTS_MEDIUM
        : NUMBER_OF_RESULTS_SHORT
      : NUMBER_OF_RESULTS_LONG
  const skipTrendingTokensQuery = activeTab !== SearchTab.Tokens && activeTab !== SearchTab.All

  const {
    data: tokens,
    error: flatTokensError,
    refetch: refetchFlatTokens,
    loading: flatTokensLoading,
  } = useTrendingTokensCurrencyInfos(chainFilter, { skip: skipTrendingTokensQuery || isMultichainPath })

  const {
    data: multichainResults,
    error: multichainTokensError,
    refetch: refetchMultichainTokens,
    loading: multichainTokensLoading,
  } = useMultichainTokenResults({
    pageSize: numberOfTrendingTokens,
    skip: skipTrendingTokensQuery || !isMultichainPath,
    isV2TokensEnabled,
  })

  const flatTokenOptions = useCurrencyInfosToTokenOptions({ currencyInfos: tokens })
  const multichainTokenOptions = useMultichainSearchResultsToOptions({ results: multichainResults })

  const tokensError = isMultichainPath ? multichainTokensError : flatTokensError
  const loadingTokens = isMultichainPath ? multichainTokensLoading : flatTokensLoading
  const refetchTokens = isMultichainPath ? refetchMultichainTokens : refetchFlatTokens
  const trendingTokenOptions: SearchModalOption[] = isMultichainPath
    ? (multichainTokenOptions ?? [])
    : (flatTokenOptions ?? [])

  const trendingTokenSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.TrendingTokens,
    options: trendingTokenOptions.slice(0, numberOfTrendingTokens),
  })

  // Top tokenized stocks for the empty (no-query) state. Loading/error are non-blocking: the section is simply
  // omitted when empty, and the error never surfaces as the modal's error. The shelf uses the app's default
  // enabled-chains policy (testnet-aware) and intentionally does not mirror the grouping index's includeTestnets.
  const chainIds = chainFilter != null ? [chainFilter] : []
  const { data: rankedRwaData } = useListRankedRwasQuery({
    category: RwaCategory.STOCKS,
    chainIds,
    includeSparkline1d: false,
    enabled: stocksSectionEnabled,
  })
  const stockOptions = useMemo(
    () =>
      rankedRwaData
        ? buildNoQueryRwaCollectionOptions({
            rwas: mapRankedRwaList({ response: rankedRwaData, category: RwaCategory.STOCKS }),
          })
        : [],
    [rankedRwaData],
  )
  const memoizedNewTag = useMemo(() => <NewTag />, [])
  const stocksSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.Stocks,
    name: t('tokens.selector.section.stocks'),
    options: stockOptions,
    rightElement: memoizedNewTag,
    icon: STOCKS_SECTION_ICON,
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

  const skipFavoriteWallets = activeTab !== SearchTab.Wallets && !(isWebApp && activeTab === SearchTab.All)
  const favoriteWalletsOptions = useFavoriteWalletOptions({ skip: skipFavoriteWallets })
  const favoriteWalletsSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.FavoriteWallets,
    options: favoriteWalletsOptions,
  })

  // Load top auctions (sorted by committed volume)
  const skipTopAuctionsQuery =
    !auctionSearchEnabled || !isWebApp || (activeTab !== SearchTab.Auctions && activeTab !== SearchTab.All)
  const {
    data: topAuctionOptions,
    loading: topAuctionsLoading,
    error: topAuctionsError,
    refetch: refetchTopAuctions,
  } = useTopAuctionOptions({
    chainFilter,
    skip: skipTopAuctionsQuery,
    size: activeTab === SearchTab.All ? NUMBER_OF_RESULTS_SHORT : NUMBER_OF_RESULTS_LONG,
  })
  const topAuctionsSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.TopAuctions,
    options: auctionSearchEnabled ? (topAuctionOptions ?? []) : [],
  })

  const stockSections = useMemo(
    () => (stocksSectionEnabled ? (stocksSection ?? []) : []),
    [stocksSectionEnabled, stocksSection],
  )
  const tokenSections = useMemo(
    () => [...(recentSearchSection ?? []), ...stockSections, ...(trendingTokenSection ?? [])],
    [recentSearchSection, stockSections, trendingTokenSection],
  )
  const poolSections = useMemo(
    () => [...(recentSearchSection ?? []), ...(trendingPoolSection ?? [])],
    [recentSearchSection, trendingPoolSection],
  )
  const walletSections = useMemo(
    () => [...(recentSearchSection ?? []), ...(favoriteWalletsSection ?? [])],
    [recentSearchSection, favoriteWalletsSection],
  )
  const auctionSections = useMemo(
    () => [...(recentSearchSection ?? []), ...(topAuctionsSection ?? [])],
    [recentSearchSection, topAuctionsSection],
  )
  const allSections = useMemo(
    () =>
      isWebPlatform
        ? [
            ...(recentSearchSection ?? []),
            ...stockSections,
            ...(trendingTokenSection ?? []),
            ...(trendingPoolSection ?? []),
            ...(favoriteWalletsSection ?? []),
            ...(topAuctionsSection ?? []),
          ]
        : [...(recentSearchSection ?? []), ...stockSections, ...(trendingTokenSection ?? [])],
    [
      favoriteWalletsSection,
      recentSearchSection,
      stockSections,
      topAuctionsSection,
      trendingPoolSection,
      trendingTokenSection,
    ],
  )
  const poolsLoading = topPoolsLoading || Boolean(topPools?.length && !trendingPoolOptions.length)
  const auctionsLoading = auctionSearchEnabled && topAuctionsLoading
  const auctionsError = auctionSearchEnabled ? (topAuctionsError ?? undefined) : undefined

  return useMemo((): GqlResult<OnchainItemSection<SearchModalOption>[]> => {
    switch (activeTab) {
      case SearchTab.Tokens:
        return {
          data: tokenSections,
          loading: loadingTokens,
          error: tokensError,
          refetch: refetchTokens,
        }
      case SearchTab.Pools:
        return {
          data: poolSections,
          loading: poolsLoading,
          error: topPoolsError ?? undefined,
          refetch: refetchPools,
        }
      case SearchTab.Wallets:
        return {
          data: walletSections,
          loading: false,
        }
      case SearchTab.Auctions:
        return {
          data: auctionSections,
          loading: auctionsLoading,
          error: auctionsError,
          refetch: refetchTopAuctions,
        }
      default:
      case SearchTab.All:
        return {
          data: allSections,
          loading: loadingTokens,
          error: tokensError,
          refetch: refetchTokens,
        }
    }
  }, [
    activeTab,
    allSections,
    auctionSections,
    auctionsError,
    auctionsLoading,
    poolSections,
    poolsLoading,
    topPoolsError,
    loadingTokens,
    refetchPools,
    refetchTokens,
    refetchTopAuctions,
    tokensError,
    tokenSections,
    walletSections,
  ])
}
