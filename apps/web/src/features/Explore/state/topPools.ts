import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { ExploreStatsResponse, PoolStats, TokenStats } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { parseRestProtocolVersion } from '@universe/api'
import { useMemo } from 'react'
import { DEFAULT_TICK_SPACING, V2_DEFAULT_FEE_TIER } from 'uniswap/src/constants/pools'
import { normalizeTokenAddressForCache } from 'uniswap/src/data/cache'
import {
  calculate1DVolOverTvl,
  calculateApr,
  PoolSortFields,
  PoolTableSortState,
} from '~/appGraphql/data/pools/useTopPools'
import { OrderDirection } from '~/appGraphql/data/util'
import { giveExploreStatDefaultValue, useExploreStats } from '~/features/Explore/state'
import { useExploreTablesFilterStore } from '~/features/Explore/state/exploreTablesFilterStore'
import { PoolStat } from '~/types/explore'

const COMBINED_ETH_SYMBOLS = ['WETH', 'ETH']

function convergeSymbol(symbol: string, convergeTo: string): string {
  if (COMBINED_ETH_SYMBOLS.includes(symbol.toUpperCase())) {
    return convergeTo
  }
  return symbol
}

function generatePoolNames(token0?: TokenStats, token1?: TokenStats) {
  if (!token0?.symbol || !token1?.symbol) {
    return []
  }

  const names = [
    `${token0.symbol}/${token1.symbol}`.toLowerCase(), // name
    `${token1.symbol}/${token0.symbol}`.toLowerCase(), // name reversed
  ]

  // Add cases for WETH and ETH if either token is WETH or ETH
  if (
    COMBINED_ETH_SYMBOLS.includes(token0.symbol.toUpperCase()) ||
    COMBINED_ETH_SYMBOLS.includes(token1.symbol.toUpperCase())
  ) {
    names.push(`${convergeSymbol(token0.symbol, 'ETH')}/${convergeSymbol(token1.symbol, 'ETH')}`.toLowerCase())
    names.push(`${convergeSymbol(token1.symbol, 'ETH')}/${convergeSymbol(token0.symbol, 'ETH')}`.toLowerCase())
    names.push(`${convergeSymbol(token0.symbol, 'WETH')}/${convergeSymbol(token1.symbol, 'WETH')}`.toLowerCase())
    names.push(`${convergeSymbol(token1.symbol, 'WETH')}/${convergeSymbol(token0.symbol, 'WETH')}`.toLowerCase())
  }

  return names
}

function useFilteredPools(pools?: PoolStat[], enabled = true) {
  const filterString = useExploreTablesFilterStore((s) => s.filterString)

  const lowercaseFilterString = useMemo(() => filterString.toLowerCase(), [filterString])

  return useMemo(() => {
    if (!enabled) {
      return undefined
    }
    return pools?.filter((pool) => {
      const addressIncludesFilterString = pool.id.toLowerCase().includes(lowercaseFilterString)
      const token0IncludesFilterString = pool.token0?.symbol?.toLowerCase().includes(lowercaseFilterString)
      const token1IncludesFilterString = pool.token1?.symbol?.toLowerCase().includes(lowercaseFilterString)
      const token0HashIncludesFilterString =
        pool.token0?.address && normalizeTokenAddressForCache(pool.token0.address).includes(lowercaseFilterString)
      const token1HashIncludesFilterString =
        pool.token1?.address && normalizeTokenAddressForCache(pool.token1.address).includes(lowercaseFilterString)

      const poolNames = generatePoolNames(pool.token0, pool.token1)
      const poolNamesIncludesFilterString = poolNames.some((name) => name.includes(lowercaseFilterString))

      return (
        token0IncludesFilterString ||
        token1IncludesFilterString ||
        addressIncludesFilterString ||
        token0HashIncludesFilterString ||
        token1HashIncludesFilterString ||
        poolNamesIncludesFilterString
      )
    })
  }, [enabled, lowercaseFilterString, pools])
}

function sortPools(sortState: PoolTableSortState, pools?: PoolStat[]) {
  // oxlint-disable-next-line complexity
  return pools?.sort((a, b) => {
    switch (sortState.sortBy) {
      case PoolSortFields.VolOverTvl:
        return sortState.sortDirection === OrderDirection.Desc
          ? (b.volOverTvl ?? 0) - (a.volOverTvl ?? 0)
          : (a.volOverTvl ?? 0) - (b.volOverTvl ?? 0)
      case PoolSortFields.Volume24h:
        return sortState.sortDirection === OrderDirection.Desc
          ? giveExploreStatDefaultValue(b.volume1Day?.value) - giveExploreStatDefaultValue(a.volume1Day?.value)
          : giveExploreStatDefaultValue(a.volume1Day?.value) - giveExploreStatDefaultValue(b.volume1Day?.value)
      case PoolSortFields.Volume30D:
        return sortState.sortDirection === OrderDirection.Desc
          ? giveExploreStatDefaultValue(b.volume30Day?.value) - giveExploreStatDefaultValue(a.volume30Day?.value)
          : giveExploreStatDefaultValue(a.volume30Day?.value) - giveExploreStatDefaultValue(b.volume30Day?.value)
      case PoolSortFields.Apr:
        return sortState.sortDirection === OrderDirection.Desc
          ? b.apr.greaterThan(a.apr)
            ? 1
            : -1
          : a.apr.greaterThan(b.apr)
            ? 1
            : -1
      case PoolSortFields.RewardApr:
        return sortState.sortDirection === OrderDirection.Desc
          ? (b.boostedApr ?? 0) - (a.boostedApr ?? 0)
          : (a.boostedApr ?? 0) - (b.boostedApr ?? 0)
      default:
        return sortState.sortDirection === OrderDirection.Desc
          ? giveExploreStatDefaultValue(b.totalLiquidity?.value) - giveExploreStatDefaultValue(a.totalLiquidity?.value)
          : giveExploreStatDefaultValue(a.totalLiquidity?.value) - giveExploreStatDefaultValue(b.totalLiquidity?.value)
    }
  })
}

function convertPoolStatsToPoolStat(poolStats: PoolStats): PoolStat {
  return {
    // oxlint-disable-next-line typescript/no-misused-spread -- biome-parity: oxlint is stricter here
    ...poolStats,
    apr: calculateApr({
      volume24h: giveExploreStatDefaultValue(poolStats.volume1Day?.value),
      tvl: giveExploreStatDefaultValue(poolStats.totalLiquidity?.value),
      feeTier: poolStats.feeTier ?? V2_DEFAULT_FEE_TIER,
      protocolVersion: parseRestProtocolVersion(poolStats.protocolVersion),
    }),
    boostedApr: poolStats.boostedApr,
    feeTier: {
      feeAmount: poolStats.feeTier ?? V2_DEFAULT_FEE_TIER,
      tickSpacing: DEFAULT_TICK_SPACING,
      isDynamic: false, // TODO: add dynamic fee tier check when client-explore is updated
    },
    volOverTvl: calculate1DVolOverTvl(poolStats.volume1Day?.value, poolStats.totalLiquidity?.value),
    hookAddress: poolStats.hook?.address,
  }
}

function getPoolDataByProtocol(
  data: ExploreStatsResponse | undefined,
  protocol?: ProtocolVersion,
): PoolStats[] | undefined {
  switch (protocol) {
    case ProtocolVersion.V2:
      return data?.stats?.poolStatsV2
    case ProtocolVersion.V3:
      return data?.stats?.poolStatsV3
    case ProtocolVersion.V4:
      return data?.stats?.poolStatsV4
    default:
      return data?.stats?.poolStats
  }
}

interface TopPoolData {
  data?: ExploreStatsResponse
  isLoading: boolean
  isError: boolean
}

export function useExploreContextTopPools({
  sortState,
  protocol,
  enabled = true,
}: {
  sortState: PoolTableSortState
  protocol?: ProtocolVersion
  enabled?: boolean
}) {
  const { data, isLoading, isError } = useExploreStats()
  return useTopPoolsLegacy({
    topPoolData: { data, isLoading, isError },
    sortState,
    protocol,
    enabled,
  })
}

export function useTopPoolsLegacy({
  topPoolData,
  sortState,
  protocol,
  enabled = true,
}: {
  topPoolData: TopPoolData
  sortState: PoolTableSortState
  protocol?: ProtocolVersion
  enabled?: boolean
}) {
  const { data, isLoading, isError } = topPoolData
  const poolStatsByProtocol = getPoolDataByProtocol(data, protocol)

  const { sortedPoolStats, boostedPoolStats } = useMemo(() => {
    if (!enabled) {
      return { sortedPoolStats: undefined, boostedPoolStats: undefined }
    }
    const poolStats = poolStatsByProtocol?.map((poolStat: PoolStats) => convertPoolStatsToPoolStat(poolStat))
    const sortedPools = sortPools(sortState, poolStats)
    const boostedPools = sortedPools
      ?.filter((pool) => typeof pool.boostedApr === 'number' && pool.boostedApr > 0)
      .sort((a, b) => (b.boostedApr ?? 0) - (a.boostedApr ?? 0))

    return { sortedPoolStats: sortedPools, boostedPoolStats: boostedPools }
  }, [enabled, poolStatsByProtocol, sortState])

  const filteredPoolStats = useFilteredPools(sortedPoolStats, enabled)

  return {
    topPools: filteredPoolStats,
    topBoostedPools: boostedPoolStats,
    isLoading: enabled && isLoading,
    isError: enabled && isError,
  }
}
