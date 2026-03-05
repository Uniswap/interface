import { type InfiniteData, useInfiniteQuery } from '@tanstack/react-query'
import { type DataApiToken, type ListTopTokensResponse, TopTokensOrderBy } from '@universe/api'
import { useMemo } from 'react'
import { dataApiQueries } from 'uniswap/src/data/apiClients/dataApiService/dataApiQueries'
import { normalizeTokenAddressForCache } from 'uniswap/src/data/cache'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { SparklineMap } from '~/appGraphql/data/types'
import { PricePoint, TimePeriod, unwrapToken } from '~/appGraphql/data/util'
import { TokenSortMethod } from '~/components/Tokens/constants'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { useExploreTablesFilterStore } from '~/pages/Explore/exploreTablesFilterStore'
import { EXPLORE_API_PAGE_SIZE } from '~/state/explore/constants'
import { useInfiniteLoadMore } from '~/state/explore/hooks/useInfiniteLoadMore'
import { getVolumeForTimePeriod } from '~/state/explore/topTokens/utils/getVolumeForTimePeriod'
import { sortTokens } from '~/state/explore/topTokens/utils/sortTokens'
import { TokenStat } from '~/state/explore/types'
import { getChainIdFromChainUrlParam } from '~/utils/chainParams'

/**
 * Maps TokenSortMethod to TopTokensOrderBy for backend sorting.
 * Note: PRICE sorting is not supported by the backend, so we omit orderBy
 * and apply client-side sorting instead.
 */
const tokenSortMethodToOrderBy: Partial<Record<TokenSortMethod, TopTokensOrderBy>> = {
  [TokenSortMethod.FULLY_DILUTED_VALUATION]: TopTokensOrderBy.FDV,
  [TokenSortMethod.VOLUME]: TopTokensOrderBy.VOLUME_1D,
  [TokenSortMethod.HOUR_CHANGE]: TopTokensOrderBy.PRICE_CHANGE_1H,
  [TokenSortMethod.DAY_CHANGE]: TopTokensOrderBy.PRICE_CHANGE_1D,
}

/** Maps TimePeriod to volume TopTokensOrderBy for dynamic volume sorting. */
const timePeriodToVolumeOrderBy: Record<TimePeriod, TopTokensOrderBy> = {
  [TimePeriod.HOUR]: TopTokensOrderBy.VOLUME_1H,
  [TimePeriod.DAY]: TopTokensOrderBy.VOLUME_1D,
  [TimePeriod.WEEK]: TopTokensOrderBy.VOLUME_7D,
  [TimePeriod.MONTH]: TopTokensOrderBy.VOLUME_30D,
  [TimePeriod.YEAR]: TopTokensOrderBy.VOLUME_1Y,
  [TimePeriod.MAX]: TopTokensOrderBy.VOLUME_1Y, // MAX falls back to 1Y as largest available
}

/** Converts DataApiToken to TokenStat for compatibility with existing UI */
function convertDataApiTokenToTokenStat(token: DataApiToken, timePeriod: TimePeriod): TokenStat {
  const chainName = toGraphQLChain(token.chainId as UniverseChainId)
  const priceHistory: PricePoint[] | undefined = token.stats?.priceHistory1d.map((point) => ({
    timestamp: Number(point.timestamp),
    value: point.value,
  }))
  const volumeValue = getVolumeForTimePeriod(token.stats, timePeriod)

  return {
    chain: chainName,
    address: token.address,
    name: token.name,
    symbol: token.symbol,
    decimals: token.decimals,
    logo: token.metadata?.logoUrl,
    price: token.stats?.price !== undefined ? { value: token.stats.price } : undefined,
    fullyDilutedValuation: token.stats?.fdv !== undefined ? { value: token.stats.fdv } : undefined,
    pricePercentChange1Hour:
      token.stats?.priceChange1h !== undefined ? { value: token.stats.priceChange1h } : undefined,
    pricePercentChange1Day: token.stats?.priceChange1d !== undefined ? { value: token.stats.priceChange1d } : undefined,
    volume: volumeValue !== undefined ? { value: volumeValue } : undefined,
    priceHistory,
    project: {
      name: token.metadata?.projectName,
      logo: token.metadata?.logoUrl ? { url: token.metadata.logoUrl } : undefined,
      safetyLevel: token.metadata?.safetyLevel.toString(),
      isSpam: token.metadata?.spamCode !== undefined && token.metadata.spamCode !== 0,
    },
  } as TokenStat
}

/** Filters tokens by search string (name, symbol, address, project name) */
function filterTokensBySearchString(tokens: TokenStat[], filterString: string): TokenStat[] {
  if (!filterString) {
    return tokens
  }
  const lowercaseFilter = filterString.toLowerCase()
  return tokens.filter((token) => {
    const addressMatch = normalizeTokenAddressForCache(token.address).includes(lowercaseFilter)
    const projectNameMatch = token.project?.name?.toLowerCase().includes(lowercaseFilter)
    const nameMatch = token.name?.toLowerCase().includes(lowercaseFilter)
    const symbolMatch = token.symbol?.toLowerCase().includes(lowercaseFilter)
    return projectNameMatch || nameMatch || symbolMatch || addressMatch
  })
}

/** Builds a rank map from tokens (currencyId -> 1-based rank) */
function buildTokenSortRank(tokens: TokenStat[]): Record<string, number> {
  return tokens.reduce(
    // eslint-disable-next-line max-params
    (acc, cur, i) => {
      if (!cur.address) {
        return acc
      }
      const currChainId = getChainIdFromChainUrlParam(cur.chain.toLowerCase())
      const currCurrencyId = buildCurrencyId(currChainId ?? UniverseChainId.Mainnet, cur.address)
      return { ...acc, [currCurrencyId]: i + 1 }
    },
    {} as Record<string, number>,
  )
}

/** Builds sparklines map from tokens (address -> priceHistory) */
function buildSparklines(tokens: TokenStat[]): SparklineMap {
  const map: SparklineMap = {}
  tokens.forEach((tokenStat) => {
    const tokenChainId = getChainIdFromChainUrlParam(tokenStat.chain.toLowerCase())
    const unwrapped = tokenChainId ? unwrapToken(tokenChainId, tokenStat) : undefined
    if (unwrapped?.address) {
      const address =
        unwrapped.address === NATIVE_CHAIN_ID ? NATIVE_CHAIN_ID : normalizeTokenAddressForCache(unwrapped.address)
      map[address] = unwrapped.priceHistory
    }
  })
  return map
}

/**
 * Hook that fetches and processes tokens from the backend with sorting/filtering.
 * Handles pagination, client-side price sorting, and search filtering.
 */
function useTokenData({
  chainId,
  enabled,
  sortMethod,
  sortAscending,
}: {
  chainId: UniverseChainId | undefined
  enabled: boolean
  sortMethod: TokenSortMethod
  sortAscending: boolean
}) {
  const { filterString, timePeriod } = useExploreTablesFilterStore((s) => ({
    filterString: s.filterString,
    timePeriod: s.timePeriod,
  }))
  const enabledChains = useEnabledChains()
  const isPriceSorting = sortMethod === TokenSortMethod.PRICE

  // Use time-period-specific volume sorting when sorting by volume
  // For price sorting, we don't pass orderBy and let the backend use its default
  const orderBy = isPriceSorting
    ? undefined
    : sortMethod === TokenSortMethod.VOLUME
      ? timePeriodToVolumeOrderBy[timePeriod]
      : tokenSortMethodToOrderBy[sortMethod]

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery(
    dataApiQueries.listTopTokens({
      params: {
        chainIds: chainId ? [chainId] : enabledChains.chains,
        ...(orderBy && { orderBy }),
        // Don't apply BE ascending when sorting by price (we'll sort client-side)
        ...(!isPriceSorting && { ascending: sortAscending }),
        pageSize: EXPLORE_API_PAGE_SIZE,
      },
      enabled,
    }),
  )

  // Flatten paginated results
  const infiniteData = data as InfiniteData<ListTopTokensResponse> | undefined
  const allTokens = useMemo(() => infiniteData?.pages.flatMap((page) => page.tokens), [infiniteData?.pages])

  // Convert and optionally sort (price sorting is client-side only)
  const tokenStats = useMemo(() => {
    const converted = allTokens?.map((token) => convertDataApiTokenToTokenStat(token, timePeriod))
    if (!converted) {
      return undefined
    }
    if (isPriceSorting) {
      return sortTokens({ tokens: converted, sortMethod: TokenSortMethod.PRICE, sortAscending })
    }
    return converted
  }, [allTokens, isPriceSorting, sortAscending, timePeriod])

  // Apply search filter
  const filteredTokens = useMemo(
    () => (tokenStats ? filterTokensBySearchString(tokenStats, filterString) : undefined),
    [tokenStats, filterString],
  )

  return {
    filteredTokens,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  }
}

/**
 * Hook that uses the new ListTopTokens endpoint with backend filtering/sorting.
 * @param chainId - Optional chain ID to filter tokens
 * @param enabled - Whether the query should be enabled (default: true)
 * @param sortMethod - Current sort column (caller manages state)
 * @param sortAscending - Current sort direction (caller manages state)
 */
export function useBackendSortedTopTokens({
  chainId,
  enabled,
  sortMethod,
  sortAscending,
}: {
  chainId: UniverseChainId | undefined
  enabled: boolean
  sortMethod: TokenSortMethod
  sortAscending: boolean
}) {
  const { filteredTokens, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useTokenData({
    chainId,
    enabled,
    sortMethod,
    sortAscending,
  })

  const tokenSortRank = useMemo(() => buildTokenSortRank(filteredTokens ?? []), [filteredTokens])
  const sparklines = useMemo(() => buildSparklines(filteredTokens ?? []), [filteredTokens])

  const loadMore = useInfiniteLoadMore({
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    dataLength: filteredTokens?.length ?? 0,
  })

  return {
    topTokens: filteredTokens,
    sparklines,
    tokenSortRank,
    isLoading,
    isError: !!error,
    loadMore,
    hasNextPage,
    isFetchingNextPage,
  }
}
