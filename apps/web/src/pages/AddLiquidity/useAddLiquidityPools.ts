import { InfiniteData, useInfiniteQuery } from '@tanstack/react-query'
import { ChainId } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/types_pb'
import type { ListPoolsResponse } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/api_pb'
import { PoolSortBy, PoolSummary } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import { type Currency, Percent } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { DEFAULT_TICK_SPACING, DYNAMIC_FEE_AMOUNT } from 'uniswap/src/constants/pools'
import { liquidityQueries } from 'uniswap/src/data/apiClients/liquidityService/liquidityQueries'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { PoolSortFields, PoolTableSortState } from '~/appGraphql/data/pools/useTopPools'
import { OrderDirection } from '~/appGraphql/data/util'
import { EXPLORE_API_PAGE_SIZE } from '~/features/Explore/state/constants'
import { useInfiniteLoadMore } from '~/features/Explore/state/hooks/useInfiniteLoadMore'
import { getTokenOrZeroAddress } from '~/features/Liquidity/utils/currency'
import { getProtocolVersionLabel, protocolsToProtocolVersion } from '~/features/Liquidity/utils/protocolVersion'
import { PoolStat } from '~/types/explore'

/**
 * Maps the table's sort field to the ListPools endpoint's PoolSortBy.
 * The endpoint only supports TVL / 1-day volume / APR; unsupported fields fall back to TVL.
 */
const poolSortFieldToSortBy: Partial<Record<PoolSortFields, PoolSortBy>> = {
  [PoolSortFields.TVL]: PoolSortBy.TVL_USD,
  [PoolSortFields.Volume24h]: PoolSortBy.VOLUME_USD,
  [PoolSortFields.Apr]: PoolSortBy.APR,
}

/**
 * Convert a PoolSummary from the liquidity ListPools endpoint to a PoolStat for the pool table.
 * Token metadata (symbol/name/decimals/logo) is provided inline by the endpoint via token0/token1Metadata.
 */
function convertPoolSummaryToPoolStat(pool: PoolSummary): PoolStat {
  const chainId = pool.chainId as UniverseChainId
  const chainName = toGraphQLChain(chainId)

  // The API returns apr as a float (e.g. 0.125 for 12.5%); convert to Percent for the table's formatPercent.
  const aprPercent = pool.apr ? new Percent(Math.round(pool.apr * 10000), 10000) : new Percent(0)

  return {
    id: pool.poolIdentifier,
    chain: chainName,
    protocolVersion: getProtocolVersionLabel(protocolsToProtocolVersion(pool.protocolVersion)),
    token0: {
      chain: chainName,
      address: pool.token0Address || undefined,
      symbol: pool.token0Metadata?.symbol,
      name: pool.token0Metadata?.name,
      decimals: pool.token0Metadata?.decimals,
      logo: pool.token0Metadata?.logoUrl,
    },
    token1: {
      chain: chainName,
      address: pool.token1Address || undefined,
      symbol: pool.token1Metadata?.symbol,
      name: pool.token1Metadata?.name,
      decimals: pool.token1Metadata?.decimals,
      logo: pool.token1Metadata?.logoUrl,
    },
    totalLiquidity: { value: pool.tvlUsd },
    volume1Day: { value: pool.volumeUsd1d },
    volume30Day: undefined,
    apr: aprPercent,
    boostedApr: undefined,
    feeTier: {
      feeAmount: pool.feeTier,
      tickSpacing: pool.tickSpacing || DEFAULT_TICK_SPACING,
      isDynamic: pool.feeTier === DYNAMIC_FEE_AMOUNT,
    },
    volOverTvl: undefined,
    hookAddress: pool.hookAddress,
  } as PoolStat
}

/**
 * Hook that provides pool data for the AddLiquidity page using the liquidity ListPools endpoint.
 *
 * A single endpoint serves both cases:
 * - No tokens selected: top pools across the selected chain (or all enabled chains).
 * - One or two tokens selected: pools filtered by a single token (matches either side) or a token pair.
 *
 * Sorting and cursor pagination are handled by the backend; search (filterString) is applied client-side.
 */
export function useAddLiquidityPools({
  currency0,
  currency1,
  chainId,
  sortState,
  filterString,
}: {
  currency0?: Currency
  currency1?: Currency
  chainId?: UniverseChainId
  sortState: PoolTableSortState
  filterString: string
}): {
  pools: PoolStat[] | undefined
  isLoading: boolean
  isError: boolean
  loadMore: ({ onComplete }: { onComplete?: () => void }) => void
  hasNextPage: boolean
} {
  const enabledChains = useEnabledChains()

  const hasTokenFilter = Boolean(currency0 || currency1)
  // Token addresses are chain-specific, so a token filter must target a single chain.
  const effectiveChainId = chainId ?? currency0?.chainId ?? currency1?.chainId

  const token0Address = currency0 ? getTokenOrZeroAddress(currency0) : undefined
  const token1Address = currency1 ? getTokenOrZeroAddress(currency1) : undefined

  // Both tokens → pair filter; one token → single-token filter (matches either side); none → no token filter.
  const tokenParams =
    currency0 && currency1
      ? { token0Address, token1Address }
      : (token0Address ?? token1Address)
        ? { tokenAddress: token0Address ?? token1Address }
        : {}

  // ChainId enum values equal the numeric chain ids, so UniverseChainId values map directly.
  const chainIds = (effectiveChainId ? [effectiveChainId] : enabledChains.chains).map((id) => id as ChainId)

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery(
    liquidityQueries.listPools({
      params: {
        chainIds,
        ...tokenParams,
        sortBy: poolSortFieldToSortBy[sortState.sortBy] ?? PoolSortBy.TVL_USD,
        ascending: sortState.sortDirection === OrderDirection.Asc,
        limit: EXPLORE_API_PAGE_SIZE,
      },
      enabled: !hasTokenFilter || effectiveChainId !== undefined,
    }),
  )

  const infiniteData = data as InfiniteData<ListPoolsResponse> | undefined
  const allPools = useMemo(
    () => infiniteData?.pages.flatMap((page: ListPoolsResponse) => page.pools),
    [infiniteData?.pages],
  )

  const pools = useMemo(() => {
    if (!allPools) {
      return undefined
    }
    const converted = allPools.map(convertPoolSummaryToPoolStat)
    if (!filterString) {
      return converted
    }
    const lowercaseFilter = filterString.toLowerCase()
    return converted.filter((pool) => {
      const poolName = `${pool.token0?.symbol ?? ''}/${pool.token1?.symbol ?? ''}`
      const searchableValues: (string | undefined)[] = [
        pool.token0?.symbol,
        pool.token1?.symbol,
        pool.token0?.address,
        pool.token1?.address,
        pool.id,
        poolName,
      ]
      return searchableValues.some((value) => value?.toLowerCase().includes(lowercaseFilter))
    })
  }, [allPools, filterString])

  const loadMore = useInfiniteLoadMore({
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    dataLength: pools?.length ?? 0,
  })

  return {
    pools,
    isLoading,
    isError: !!error,
    loadMore,
    hasNextPage,
  }
}
