import { Pool, ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { type Currency, Percent } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { DEFAULT_TICK_SPACING } from 'uniswap/src/constants/pools'
import { useGetPoolsByTokens } from 'uniswap/src/data/rest/getPools'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useCurrencyInfos } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { PoolSortFields, PoolTableSortState } from '~/appGraphql/data/pools/useTopPools'
import { OrderDirection } from '~/appGraphql/data/util'
import { useBackendSortedTopPools } from '~/features/Explore/state/topPools/useBackendSortedTopPools'
import { getTokenOrZeroAddress } from '~/features/Liquidity/utils/currency'
import { getProtocolVersionLabel } from '~/features/Liquidity/utils/protocolVersion'
import { PoolStat } from '~/types/explore'

/**
 * Convert a Pool from the ListPools endpoint to a PoolStat for display in the pool table.
 * Token metadata is resolved via CurrencyInfo lookup keyed by currencyId.
 */
function convertListPoolToPoolStat({
  pool,
  currencyInfoMap,
}: {
  pool: Pool
  currencyInfoMap: Map<string, CurrencyInfo>
}): PoolStat {
  const chainId = pool.chainId as UniverseChainId
  const chainName = toGraphQLChain(chainId)
  const tvl = parseFloat(pool.totalLiquidityUsd) || 0

  const token0Info = currencyInfoMap.get(buildCurrencyId(chainId, pool.token0))
  const token1Info = currencyInfoMap.get(buildCurrencyId(chainId, pool.token1))

  const makeTokenInfo = (address: string, info?: CurrencyInfo) => ({
    chain: chainName,
    address: address || undefined,
    symbol: info?.currency.symbol,
    name: info?.currency.name,
    decimals: info?.currency.decimals,
    logo: info?.logoUrl ?? undefined,
  })

  // The API returns apr as a float (e.g. 0.125 for 12.5%)
  // Convert to Percent for compatibility with the table's formatPercent usage
  const aprPercent = pool.apr ? new Percent(Math.round(pool.apr * 10000), 10000) : new Percent(0)

  return {
    id: pool.poolId,
    chain: chainName,
    protocolVersion: getProtocolVersionLabel(pool.protocolVersion),
    token0: makeTokenInfo(pool.token0, token0Info),
    token1: makeTokenInfo(pool.token1, token1Info),
    totalLiquidity: { value: tvl },
    volume1Day: undefined,
    volume30Day: undefined,
    apr: aprPercent,
    boostedApr: pool.boostedApr || undefined,
    feeTier: {
      feeAmount: pool.fee,
      tickSpacing: pool.tickSpacing || DEFAULT_TICK_SPACING,
      isDynamic: pool.isDynamicFee,
    },
    volOverTvl: undefined,
    hookAddress: pool.hooks?.address,
  } as PoolStat
}

function sortListPools(pools: PoolStat[], sortState: PoolTableSortState): PoolStat[] {
  return [...pools].sort((a, b) => {
    const desc = sortState.sortDirection === OrderDirection.Desc
    const tvlA = a.totalLiquidity?.value ?? 0
    const tvlB = b.totalLiquidity?.value ?? 0

    switch (sortState.sortBy) {
      case PoolSortFields.Apr: {
        const diff = a.apr.greaterThan(b.apr) ? 1 : a.apr.lessThan(b.apr) ? -1 : 0
        return desc ? -diff : diff
      }
      case PoolSortFields.RewardApr:
        return desc ? (b.boostedApr ?? 0) - (a.boostedApr ?? 0) : (a.boostedApr ?? 0) - (b.boostedApr ?? 0)
      default:
        // Default to TVL sort (also handles TVL sort field)
        return desc ? tvlB - tvlA : tvlA - tvlB
    }
  })
}

/**
 * Hook that provides pool data for the AddLiquidity page.
 *
 * - No tokens selected: uses useBackendSortedTopPools directly with filters passed explicitly
 * - One or two tokens selected: uses the ListPools endpoint filtered by token addresses
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
  loadMore?: ({ onComplete }: { onComplete?: () => void }) => void
} {
  const hasTokenFilter = Boolean(currency0 || currency1)

  // Path 1: No tokens selected — use backend-sorted top pools with filters passed explicitly
  const topPoolsResult = useBackendSortedTopPools({
    sortState,
    chainId,
    filterString,
    enabled: !hasTokenFilter,
  })

  // Path 2: Tokens selected — use ListPools endpoint
  // Derive chainId from selected currencies if not explicitly set
  const effectiveChainId = chainId ?? currency0?.chainId ?? currency1?.chainId

  const token0Address = currency0 ? getTokenOrZeroAddress(currency0) : undefined
  const token1Address = currency1 ? getTokenOrZeroAddress(currency1) : undefined

  const listPoolsResult = useGetPoolsByTokens(
    {
      chainId: effectiveChainId,
      token0: token0Address ?? '',
      token1: token1Address ?? '',
      protocolVersions: [ProtocolVersion.V2, ProtocolVersion.V3, ProtocolVersion.V4],
    },
    hasTokenFilter && effectiveChainId !== undefined,
  )

  // Collect all unique token addresses from the ListPools response for batch CurrencyInfo lookup.
  // This resolves token metadata (symbol, name, logo) for all pool tokens including
  // tokens not in the filter (important for single-token filtering).
  const tokenCurrencyIds = useMemo(() => {
    if (!listPoolsResult.data?.pools) {
      return []
    }
    const ids = new Set<string>()
    for (const pool of listPoolsResult.data.pools) {
      const poolChainId = pool.chainId as UniverseChainId
      if (pool.token0) {
        ids.add(buildCurrencyId(poolChainId, pool.token0))
      }
      if (pool.token1) {
        ids.add(buildCurrencyId(poolChainId, pool.token1))
      }
    }
    return Array.from(ids)
  }, [listPoolsResult.data?.pools])

  const currencyInfoResults = useCurrencyInfos(tokenCurrencyIds, { skip: !hasTokenFilter })

  const currencyInfoMap = useMemo(() => {
    const map = new Map<string, CurrencyInfo>()
    for (let i = 0; i < tokenCurrencyIds.length; i++) {
      const info = currencyInfoResults[i]
      if (info) {
        map.set(tokenCurrencyIds[i]!, info)
      }
    }
    return map
  }, [tokenCurrencyIds, currencyInfoResults])

  const listPoolsConverted = useMemo(() => {
    if (!hasTokenFilter || !listPoolsResult.data?.pools) {
      return undefined
    }
    const converted = listPoolsResult.data.pools
      .map((pool: Pool) => convertListPoolToPoolStat({ pool, currencyInfoMap }))
      .filter(
        (pool) =>
          !filterString ||
          pool.token0?.symbol?.toLowerCase().includes(filterString.toLowerCase()) ||
          pool.token1?.symbol?.toLowerCase().includes(filterString.toLowerCase()),
      )
    return sortListPools(converted, sortState)
  }, [hasTokenFilter, listPoolsResult.data?.pools, currencyInfoMap, sortState, filterString])

  if (hasTokenFilter) {
    return {
      pools: listPoolsConverted,
      isLoading: listPoolsResult.isLoading,
      isError: listPoolsResult.isError,
      loadMore: undefined,
    }
  }

  return {
    pools: topPoolsResult.topPools,
    isLoading: topPoolsResult.isLoading,
    isError: topPoolsResult.isError,
    loadMore: topPoolsResult.loadMore,
  }
}
