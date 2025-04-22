import { ExploreStatsResponse, PoolStats } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { exploreSearchStringAtom } from 'components/Tokens/state'
import {
  PoolSortFields,
  PoolTableSortState,
  V2_BIPS,
  calculate1DVolOverTvl,
  calculateApr,
} from 'graphql/data/pools/useTopPools'
import { OrderDirection } from 'graphql/data/util'
import { useAtomValue } from 'jotai/utils'
import { useContext, useMemo } from 'react'
import { ExploreContext, giveExploreStatDefaultValue } from 'state/explore'
import { PoolStat } from 'state/explore/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

function useFilteredPools(pools?: PoolStat[]) {
  const filterString = useAtomValue(exploreSearchStringAtom)
  const isV4DataEnabled = useFeatureFlag(FeatureFlags.V4Data)

  const lowercaseFilterString = useMemo(() => filterString.toLowerCase(), [filterString])

  return useMemo(
    () =>
      pools?.filter((pool) => {
        const addressIncludesFilterString = pool.id.toLowerCase().includes(lowercaseFilterString)
        const token0IncludesFilterString = pool.token0?.symbol?.toLowerCase().includes(lowercaseFilterString)
        const token1IncludesFilterString = pool.token1?.symbol?.toLowerCase().includes(lowercaseFilterString)
        const token0HashIncludesFilterString = pool.token0?.address?.toLowerCase().includes(lowercaseFilterString)
        const token1HashIncludesFilterString = pool.token1?.address?.toLowerCase().includes(lowercaseFilterString)
        const poolName = `${pool.token0?.symbol}/${pool.token1?.symbol}`.toLowerCase()
        const poolNameIncludesFilterString = poolName.includes(lowercaseFilterString)
        return (
          (token0IncludesFilterString ||
            token1IncludesFilterString ||
            addressIncludesFilterString ||
            token0HashIncludesFilterString ||
            token1HashIncludesFilterString ||
            poolNameIncludesFilterString) &&
          (pool.protocolVersion?.toLowerCase() !== 'v4' || isV4DataEnabled)
        )
      }),
    [isV4DataEnabled, lowercaseFilterString, pools],
  )
}

function sortPools(sortState: PoolTableSortState, pools?: PoolStat[]) {
  return pools?.sort((a, b) => {
    switch (sortState.sortBy) {
      case PoolSortFields.VolOverTvl:
        return sortState.sortDirection === OrderDirection.Desc
          ? (b?.volOverTvl ?? 0) - (a?.volOverTvl ?? 0)
          : (a?.volOverTvl ?? 0) - (b?.volOverTvl ?? 0)
      case PoolSortFields.Volume24h:
        return sortState.sortDirection === OrderDirection.Desc
          ? giveExploreStatDefaultValue(b?.volume1Day?.value) - giveExploreStatDefaultValue(a?.volume1Day?.value)
          : giveExploreStatDefaultValue(a?.volume1Day?.value) - giveExploreStatDefaultValue(b?.volume1Day?.value)
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
      default:
        return sortState.sortDirection === OrderDirection.Desc
          ? giveExploreStatDefaultValue(b?.totalLiquidity?.value) -
              giveExploreStatDefaultValue(a?.totalLiquidity?.value)
          : giveExploreStatDefaultValue(a?.totalLiquidity?.value) -
              giveExploreStatDefaultValue(b?.totalLiquidity?.value)
    }
  })
}

function convertPoolStatsToPoolStat(poolStats: PoolStats): PoolStat {
  return {
    ...poolStats,
    apr: calculateApr(
      giveExploreStatDefaultValue(poolStats.volume1Day?.value),
      giveExploreStatDefaultValue(poolStats.totalLiquidity?.value),
      poolStats.feeTier ?? V2_BIPS,
    ),
    feeTier: poolStats.feeTier ?? V2_BIPS,
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

export function useExploreContextTopPools(sortState: PoolTableSortState, protocol?: ProtocolVersion) {
  const {
    exploreStats: { data, isLoading, error: isError },
  } = useContext(ExploreContext)
  return useTopPools({ data, isLoading, isError }, sortState, protocol)
}

export function useTopPools(topPoolData: TopPoolData, sortState: PoolTableSortState, protocol?: ProtocolVersion) {
  const { data, isLoading, isError } = topPoolData
  const poolStatsByProtocol = getPoolDataByProtocol(data, protocol)
  const sortedPoolStats = useMemo(() => {
    const poolStats = poolStatsByProtocol?.map((poolStat: PoolStats) => convertPoolStatsToPoolStat(poolStat))
    return sortPools(sortState, poolStats)
  }, [poolStatsByProtocol, sortState])
  const filteredPoolStats = useFilteredPools(sortedPoolStats)

  return { topPools: filteredPoolStats, isLoading, isError }
}
