import type { PlainMessage } from '@bufbuild/protobuf'
import { useQuery } from '@tanstack/react-query'
import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { ListPoolsResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { PoolsOrderBy } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { UniverseChainId } from '@universe/chains'
import { GatedFeature, useIsFeatureGated } from '@universe/compliance'
import { isMobileApp, isWebApp, isWebPlatform } from '@universe/environment'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TrendUp } from 'ui/src/components/icons/TrendUp'
import { usePoolSearchResultsToPoolOptions } from 'uniswap/src/components/lists/items/pools/usePoolSearchResultsToPoolOptions'
import type { SearchModalOption } from 'uniswap/src/components/lists/items/types'
import { useFavoriteWalletOptions } from 'uniswap/src/components/lists/items/wallets/useFavoriteWalletOptions'
import type { OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'
import { OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { useOnchainItemListSection } from 'uniswap/src/components/lists/utils'
import { NewTag } from 'uniswap/src/components/pill/NewTag'
import { multichainSearchResultsToOptions } from 'uniswap/src/components/TokenSelector/hooks/useMultichainSearchResultsToOptions'
import { getListPoolsQueryOptions } from 'uniswap/src/data/apiClients/dataApiService/pools/queries'
import { useListRankedRwasQuery } from 'uniswap/src/data/apiClients/dataApiService/rwa/listRankedRwas'
import { mapRankedRwaList } from 'uniswap/src/data/apiClients/dataApiService/rwa/mapRankedRwa'
import { rankedPoolToPoolSearchResult } from 'uniswap/src/data/apiClients/dataApiService/search/search'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useTopAuctionOptions } from 'uniswap/src/features/dataApi/searchAuctions'
import { top1DVolumeResultsToTokenOptions, useTop1DVolumeTokens } from 'uniswap/src/features/dataApi/top1DVolumeTokens'
import type { PoolSearchResult } from 'uniswap/src/features/dataApi/types'
import {
  NUMBER_OF_RESULTS_LONG,
  NUMBER_OF_RESULTS_MEDIUM,
  NUMBER_OF_RESULTS_SHORT,
  NUMBER_OF_SPOTLIT_CATEGORY_TOKENS_ALL_TAB,
  NUMBER_OF_SPOTLIT_CATEGORY_TOKENS_TOKENS_TAB,
} from 'uniswap/src/features/search/SearchModal/constants'
import { useRecentSearchSection } from 'uniswap/src/features/search/SearchModal/hooks/useRecentSearchSection'
import type { SearchModalSectionResult } from 'uniswap/src/features/search/SearchModal/hooks/useSectionsForSearchResultsUtils'
import {
  useSpotlitCategorySections,
  type SpotlitCategorySectionsResult,
} from 'uniswap/src/features/search/SearchModal/hooks/useSpotlitCategorySections'
import { buildNoQueryRwaCollectionOptions } from 'uniswap/src/features/search/SearchModal/stocks/noQueryStocks'
import { SearchTab } from 'uniswap/src/features/search/SearchModal/types'
import { noop } from 'utilities/src/react/noop'
import { holdQueryResult } from 'utilities/src/reactQuery/holdQueryResult'
import type { DerivedQueryResult } from 'utilities/src/reactQuery/types'

// Stable element identity so the stocks section memo (and the sibling memoizedNewTag) isn't busted every render.
const STOCKS_SECTION_ICON = <TrendUp color="$neutral2" size="$icon.16" />

export interface NoQuerySearchSections extends SearchModalSectionResult {
  skeletonPillCount: number
}

type NoQueryTabResult = SearchModalSectionResult & { isInitialLoading: boolean }

type TokenShelfState = Omit<SearchModalSectionResult, 'data'> & {
  isInitialLoading: boolean
  sections: OnchainItemSection<SearchModalOption>[] | undefined
}

/** Spotlit categories when enabled, else the legacy Trending/Stocks pair (`sections` undefined). */
function selectTokenShelfState({
  spotlit,
  legacy,
}: {
  spotlit: SpotlitCategorySectionsResult
  legacy: Omit<TokenShelfState, 'sections'>
}): TokenShelfState {
  return spotlit.enabled
    ? {
        sections: spotlit.sections,
        isLoading: spotlit.isLoading,
        isInitialLoading: spotlit.isInitialLoading,
        error: null,
        refetch: spotlit.refetch,
      }
    : { ...legacy, sections: undefined }
}

// Stable empty input so usePoolSearchResultsToPoolOptions' memos don't recompute while pools are pending.
const EMPTY_POOL_SEARCH_RESULTS: PoolSearchResult[] = []

function selectPoolSearchResults(data: PlainMessage<ListPoolsResponse>): PoolSearchResult[] {
  return data.pools.map(rankedPoolToPoolSearchResult).filter((pool): pool is PoolSearchResult => pool !== undefined)
}

/** Falls back to an empty list, so `data` is always present. */
type TrendingTokenResults = Omit<DerivedQueryResult<SearchModalOption[]>, 'data'> & {
  data: SearchModalOption[]
  /** First load only, unlike `isLoading`, which also covers background refetches. */
  isInitialLoading: boolean
}

/**
 * Trending token options for the no-query state. Unfiltered, rows render as multichain options;
 * with a chain filter they flatten to one token option per token on that chain.
 */
function useTrendingTokenResults({
  chainFilter,
  pageSize,
  skip,
}: {
  chainFilter: UniverseChainId | null
  pageSize: number
  skip: boolean
}): TrendingTokenResults {
  const { data: results, error, refetch, isLoading } = useTop1DVolumeTokens({ chainFilter, pageSize, skip })
  const isInitialLoading = isLoading && results === undefined && !error

  const options = useMemo((): SearchModalOption[] | undefined => {
    if (!results) {
      return undefined
    }
    return chainFilter
      ? top1DVolumeResultsToTokenOptions(results, { chainFilter })
      : multichainSearchResultsToOptions(results)
  }, [chainFilter, results])

  return { data: options ?? [], error, isLoading, isInitialLoading, refetch }
}

export function useSectionsForNoQuerySearch({
  chainFilter,
  activeTab,
  auctionSearchEnabled = false,
}: {
  chainFilter: UniverseChainId | null
  activeTab: SearchTab
  auctionSearchEnabled?: boolean
}): NoQuerySearchSections {
  const { t } = useTranslation()
  const isSearchV2UIEnabled = useFeatureFlag(FeatureFlags.SearchV2UI)
  const { chains: enabledChainIds } = useEnabledChains()
  const queryChainIds = useMemo(() => (chainFilter ? [chainFilter] : enabledChainIds), [chainFilter, enabledChainIds])

  // The "Stocks by 24H volume" section renders unless the caller's region is RWA-blocked; hidden while the
  // region is pending so blocked users never see it flash. Grouping/recents-tagging are not region-gated.
  const stocksSectionEnabled = !useIsFeatureGated(GatedFeature.ISSUER_SPECIFIC_RWA, { pendingValue: true })

  const { sections: recentSearchSection, skeletonPillCount } = useRecentSearchSection({ chainFilter, activeTab })

  // Spotlit categories replace the Trending + Stocks shelves on the All/Tokens tabs; flag off leaves them untouched.
  const isTokenTab = activeTab === SearchTab.Tokens || activeTab === SearchTab.All
  const spotlit = useSpotlitCategorySections({
    chainFilter,
    tokenCount:
      activeTab === SearchTab.All
        ? NUMBER_OF_SPOTLIT_CATEGORY_TOKENS_ALL_TAB
        : NUMBER_OF_SPOTLIT_CATEGORY_TOKENS_TOKENS_TAB,
    skip: !isTokenTab,
  })

  const numberOfTrendingTokens =
    activeTab === SearchTab.All
      ? isMobileApp
        ? NUMBER_OF_RESULTS_MEDIUM
        : NUMBER_OF_RESULTS_SHORT
      : NUMBER_OF_RESULTS_LONG
  const skipTrendingTokensQuery = !isTokenTab || spotlit.enabled

  const {
    data: trendingTokenOptions,
    error: tokensError,
    isLoading: loadingTokens,
    isInitialLoading: trendingTokensInitialLoading,
    refetch: refetchTokens,
  } = useTrendingTokenResults({
    chainFilter,
    pageSize: numberOfTrendingTokens,
    skip: skipTrendingTokensQuery,
  })

  const trendingTokenSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.TrendingTokens,
    options: trendingTokenOptions.slice(0, numberOfTrendingTokens),
  })

  // Top tokenized stocks for the empty (no-query) state. Error is non-blocking: the section is simply omitted when
  // empty, and the error never surfaces as the modal's error. The shelf uses the app's default enabled-chains
  // policy (testnet-aware) and intentionally does not mirror the grouping index's includeTestnets.
  const chainIds = chainFilter != null ? [chainFilter] : []
  const { data: rankedRwaData, isLoading: rankedRwaLoading } = useListRankedRwasQuery({
    category: RwaCategory.STOCKS,
    chainIds,
    includeSparkline1d: false,
    enabled: stocksSectionEnabled && !spotlit.enabled,
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

  // Trending pools: the same default ListPools request as the Explore pools table (all enabled chains or
  // the filtered one, every protocol version, spam and top-level filters applied, ranked by 24H volume),
  // fetched as one page sized to the number of rows the tab shows.
  const numberOfTrendingPools = activeTab === SearchTab.All ? NUMBER_OF_RESULTS_SHORT : NUMBER_OF_RESULTS_LONG
  const {
    data: topPools,
    isLoading: topPoolsLoading,
    error: topPoolsError,
    refetch: refetchPools,
  } = useQuery(
    getListPoolsQueryOptions({
      params: {
        chainIds: queryChainIds,
        sort: { orderBy: PoolsOrderBy.VOLUME_1D, ascending: false },
        filter: {
          protocolVersions: [ProtocolVersion.V2, ProtocolVersion.V3, ProtocolVersion.V4],
          applyTopLevelFilters: true,
          includeSpam: false,
        },
      },
      pageSize: numberOfTrendingPools,
      enabled: isWebPlatform && (activeTab === SearchTab.All || activeTab === SearchTab.Pools),
      select: selectPoolSearchResults,
    }),
  )
  const trendingPoolOptions = usePoolSearchResultsToPoolOptions(topPools ?? EMPTY_POOL_SEARCH_RESULTS)
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
    isLoading: topAuctionsLoading,
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
  const tokenShelf = selectTokenShelfState({
    spotlit,
    legacy: {
      isLoading: loadingTokens,
      isInitialLoading: trendingTokensInitialLoading || (stocksSectionEnabled && rankedRwaLoading),
      error: tokensError,
      refetch: refetchTokens,
    },
  })
  const tokenShelfSections = useMemo(
    () => tokenShelf.sections ?? [...stockSections, ...(trendingTokenSection ?? [])],
    [tokenShelf.sections, stockSections, trendingTokenSection],
  )
  const tokenSections = useMemo(
    () => [...(recentSearchSection ?? []), ...tokenShelfSections],
    [recentSearchSection, tokenShelfSections],
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
            ...tokenShelfSections,
            ...(trendingPoolSection ?? []),
            ...(favoriteWalletsSection ?? []),
            ...(topAuctionsSection ?? []),
          ]
        : [...(recentSearchSection ?? []), ...tokenShelfSections],
    [favoriteWalletsSection, recentSearchSection, tokenShelfSections, topAuctionsSection, trendingPoolSection],
  )
  const poolsLoading = topPoolsLoading || Boolean(topPools?.length && !trendingPoolOptions.length)
  const poolsInitialLoading = isWebPlatform && topPoolsLoading
  const auctionsLoading = auctionSearchEnabled && isWebApp && topAuctionsLoading
  const auctionsError = auctionSearchEnabled ? topAuctionsError : null
  const {
    isInitialLoading: tokensInitialLoading,
    isLoading: tokensLoading,
    error: tokensShelfError,
    refetch: refetchTokensShelf,
  } = tokenShelf

  const tabResult = useMemo((): NoQueryTabResult => {
    switch (activeTab) {
      case SearchTab.Tokens:
        return {
          data: tokenSections,
          isLoading: tokensLoading,
          isInitialLoading: tokensInitialLoading,
          error: tokensShelfError,
          refetch: refetchTokensShelf,
        }
      case SearchTab.Pools:
        return {
          data: poolSections,
          isLoading: poolsLoading,
          isInitialLoading: poolsInitialLoading,
          error: topPoolsError,
          refetch: refetchPools,
        }
      case SearchTab.Wallets:
        return {
          data: walletSections,
          isLoading: false,
          isInitialLoading: false,
          error: null,
          refetch: noop,
        }
      case SearchTab.Auctions:
        return {
          data: auctionSections,
          isLoading: auctionsLoading,
          isInitialLoading: auctionsLoading,
          error: auctionsError,
          refetch: refetchTopAuctions,
        }
      default:
      case SearchTab.All:
        return {
          data: allSections,
          isLoading: tokensLoading,
          // Web's All tab also renders pools and auctions; holding on trending alone would shift the pane as they land.
          isInitialLoading: tokensInitialLoading || poolsInitialLoading || auctionsLoading,
          error: tokensShelfError,
          refetch: refetchTokensShelf,
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
    poolsInitialLoading,
    topPoolsError,
    tokensLoading,
    tokensInitialLoading,
    refetchPools,
    refetchTokensShelf,
    refetchTopAuctions,
    tokensShelfError,
    tokenSections,
    walletSections,
  ])

  return useMemo((): NoQuerySearchSections => {
    const { isInitialLoading, ...result } = tabResult
    return { ...holdQueryResult({ result, hold: isSearchV2UIEnabled && isInitialLoading }), skeletonPillCount }
  }, [tabResult, isSearchV2UIEnabled, skeletonPillCount])
}
