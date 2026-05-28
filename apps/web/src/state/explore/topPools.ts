/* eslint-disable import/no-unused-modules */
import { ExploreStatsResponse, PoolStats } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import {
  PoolSortFields,
  PoolTableSortState,
  RingPoolSortFields,
  RingPoolTableSortState,
  V2_BIPS,
  calculate1DVolOverTvl,
  calculateApr,
} from 'appGraphql/data/pools/useTopPools'
import { OrderDirection, getPoolVolume24h, getPoolVolume30Day } from 'appGraphql/data/util'
import { exploreSearchStringAtom } from 'components/Tokens/state'
import { useAtomValue } from 'jotai/utils'
import { useContext, useMemo } from 'react'
import { ExploreContext, giveExploreStatDefaultValue } from 'state/explore'
import { PoolStat, RingPoolStat } from 'state/explore/types'
import { ONE_HOUR_MS } from 'utilities/src/time/time'

function useFilteredPools(pools?: PoolStat[]) {
  const filterString = useAtomValue(exploreSearchStringAtom)

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
          token0IncludesFilterString ||
          token1IncludesFilterString ||
          addressIncludesFilterString ||
          token0HashIncludesFilterString ||
          token1HashIncludesFilterString ||
          poolNameIncludesFilterString
        )
      }),
    [lowercaseFilterString, pools],
  )
}

function useFilteredRingPools(pools?: RingPoolStat[]) {
  const filterString = useAtomValue(exploreSearchStringAtom)

  const lowercaseFilterString = useMemo(() => filterString.toLowerCase(), [filterString])

  return useMemo(
    () =>
      pools?.filter((pool) => {
        const addressIncludesFilterString = pool.id.toLowerCase().includes(lowercaseFilterString)
        const token0IncludesFilterString = pool.token0?.originToken?.symbol
          ?.toLowerCase()
          .includes(lowercaseFilterString)
        const token1IncludesFilterString = pool.token1?.originToken?.symbol
          ?.toLowerCase()
          .includes(lowercaseFilterString)
        const token0HashIncludesFilterString = pool.token0?.originToken?.address
          ?.toLowerCase()
          .includes(lowercaseFilterString)
        const token1HashIncludesFilterString = pool.token1?.originToken?.address
          ?.toLowerCase()
          .includes(lowercaseFilterString)
        const poolName = `${pool.token0?.originToken?.symbol}/${pool.token1?.originToken?.symbol}`.toLowerCase()
        const poolNameIncludesFilterString = poolName.includes(lowercaseFilterString)
        return (
          token0IncludesFilterString ||
          token1IncludesFilterString ||
          addressIncludesFilterString ||
          token0HashIncludesFilterString ||
          token1HashIncludesFilterString ||
          poolNameIncludesFilterString
        )
      }),
    [lowercaseFilterString, pools],
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
      case PoolSortFields.RewardApr:
        return sortState.sortDirection === OrderDirection.Desc
          ? (b.boostedApr ?? 0) - (a.boostedApr ?? 0)
          : (a.boostedApr ?? 0) - (b.boostedApr ?? 0)
      default:
        return sortState.sortDirection === OrderDirection.Desc
          ? giveExploreStatDefaultValue(b?.totalLiquidity?.value) -
              giveExploreStatDefaultValue(a?.totalLiquidity?.value)
          : giveExploreStatDefaultValue(a?.totalLiquidity?.value) -
              giveExploreStatDefaultValue(b?.totalLiquidity?.value)
    }
  })
}

function sortRingPools(sortState: RingPoolTableSortState, pools?: RingPoolStat[]) {
  return pools?.sort((a, b) => {
    switch (sortState.sortBy) {
      case RingPoolSortFields.VolOverTvl:
        return sortState.sortDirection === OrderDirection.Desc
          ? (b?.volOverTvl ?? 0) - (a?.volOverTvl ?? 0)
          : (a?.volOverTvl ?? 0) - (b?.volOverTvl ?? 0)
      case RingPoolSortFields.Volume24h:
        return sortState.sortDirection === OrderDirection.Desc
          ? giveExploreStatDefaultValue(b?.volume1Day) - giveExploreStatDefaultValue(a?.volume1Day)
          : giveExploreStatDefaultValue(a?.volume1Day) - giveExploreStatDefaultValue(b?.volume1Day)
      case RingPoolSortFields.Volume30D:
        return sortState.sortDirection === OrderDirection.Desc
          ? giveExploreStatDefaultValue(b.volume30Day) - giveExploreStatDefaultValue(a.volume30Day)
          : giveExploreStatDefaultValue(a.volume30Day) - giveExploreStatDefaultValue(b.volume30Day)
      case RingPoolSortFields.Apr:
        return sortState.sortDirection === OrderDirection.Desc
          ? b.apr.greaterThan(a.apr)
            ? 1
            : -1
          : a.apr.greaterThan(b.apr)
            ? 1
            : -1
      default:
        return sortState.sortDirection === OrderDirection.Desc
          ? giveExploreStatDefaultValue(b?.tvl) - giveExploreStatDefaultValue(a?.tvl)
          : giveExploreStatDefaultValue(a?.tvl) - giveExploreStatDefaultValue(b?.tvl)
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
    boostedApr: poolStats.boostedApr,
    feeTier: poolStats.feeTier ?? V2_BIPS,
    volOverTvl: calculate1DVolOverTvl(poolStats.volume1Day?.value, poolStats.totalLiquidity?.value),
    hookAddress: poolStats.hook?.address,
  }
}

function convertRingPoolStatsToPoolStat(poolStats: RingPoolStat, currentTime: number): RingPoolStat {
  const tvl = giveExploreStatDefaultValue(Number(poolStats.totalValueLockedUSD))

  const volume1Day = getPoolVolume24h(poolStats, currentTime) // This is the latest 24h volume, not the 1 day volume
  const volume30Day = getPoolVolume30Day(poolStats, currentTime)

  return {
    ...poolStats,
    apr: calculateApr(
      giveExploreStatDefaultValue(Number(poolStats.dayData?.items?.[0]?.volumeUSD)),
      giveExploreStatDefaultValue(tvl),
      poolStats.feeTier ?? V2_BIPS,
    ),
    tvl,
    volume1Day,
    volume30Day,
    feeTier: poolStats.feeTier ?? V2_BIPS,
    volOverTvl: calculate1DVolOverTvl(volume1Day, tvl),
    hookAddress: poolStats.hookAddress,
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
    case ProtocolVersion.Fewv2:
      return data?.stats?.poolStatsV2
    default:
      return data?.stats?.poolStats
  }
}

interface TopPoolData {
  data?: ExploreStatsResponse
  isLoading: boolean
  isError: boolean
}

interface RingTopPoolData {
  data?: any
  isLoading: boolean
  isError: boolean
}

export function useExploreContextTopPools(sortState: PoolTableSortState, protocol?: ProtocolVersion) {
  const {
    exploreStats: { data, isLoading, error: isError },
  } = useContext(ExploreContext)
  return useTopPools({ data, isLoading, isError }, sortState, protocol)
}

export function useExploreContextRingTopPools(sortState: RingPoolTableSortState, protocol?: ProtocolVersion) {
  const {
    ringExploreStats: { data, isLoading, error: isError },
  } = useContext(ExploreContext)
  return useRingTopPools({ data, isLoading, isError }, sortState, protocol)
}

export function useTopPools(topPoolData: TopPoolData, sortState: PoolTableSortState, protocol?: ProtocolVersion) {
  const { data, isLoading, isError } = topPoolData
  const poolStatsByProtocol = getPoolDataByProtocol(data, protocol)

  const { sortedPoolStats, boostedPoolStats } = useMemo(() => {
    const poolStats = poolStatsByProtocol?.map((poolStat: PoolStats) => convertPoolStatsToPoolStat(poolStat))
    const sortedPools = sortPools(sortState, poolStats)
    const boostedPools = sortedPools
      ?.filter((pool) => typeof pool.boostedApr === 'number' && pool.boostedApr > 0)
      .sort((a, b) => (b.boostedApr ?? 0) - (a.boostedApr ?? 0))

    return { sortedPoolStats: sortedPools, boostedPoolStats: boostedPools }
  }, [poolStatsByProtocol, sortState])

  const filteredPoolStats = useFilteredPools(sortedPoolStats)

  return { topPools: filteredPoolStats, topBoostedPools: boostedPoolStats, isLoading, isError }
}

// blackList
const blackListPool = ['0x63c5c582feb713a125ce0a58ac2d65bb48cdafe5']

export function useRingTopPools(
  topPoolData: RingTopPoolData,
  sortState: RingPoolTableSortState,
  protocol?: ProtocolVersion,
) {
  const { data, isLoading, isError } = topPoolData
  const currentTime = useMemo(() => Math.floor(Date.now() / 1000), [])
  const poolStatsByProtocol = useMemo(() => {
    const v2Pairs = data?.v2Pairs?.items || []
    const v3Pools = data?.v3Pools?.items || []
    const v4Pools = data?.v4Pools?.items || []

    switch (protocol) {
      case ProtocolVersion.V2:
        return v2Pairs
      case ProtocolVersion.V3:
        return v3Pools
      case ProtocolVersion.V4:
        return v4Pools
      default:
        return [...v2Pairs, ...v3Pools, ...v4Pools]
    }
  }, [data, protocol])

  const sortedPoolStats = useMemo(() => {
    const poolStats = poolStatsByProtocol
      ?.map((poolStat: RingPoolStat) => convertRingPoolStatsToPoolStat(poolStat, currentTime))
      .filter((pool: RingPoolStat) => {
        const dayDataItems = pool?.dayData?.items || []
        // if poolId is in blacklist, filter it out
        if (
          (pool?.poolId && blackListPool.includes(pool.poolId.toLowerCase())) ||
          (pool?.address && blackListPool.includes(pool.address.toLowerCase()))
        ) {
          return false
        }
        return (
          (dayDataItems.length > 0 && dayDataItems[0]?.date >= Number(currentTime) - (7 * ONE_HOUR_MS) / 1000) ||
          Number(pool.totalValueLockedUSD) > 1_000_000
        ) // only show pools with swap data in the last 7 days
      })
    return sortRingPools(sortState, poolStats)
  }, [poolStatsByProtocol, sortState, currentTime])

  const filteredPoolStats = useFilteredRingPools(sortedPoolStats)

  return { topPools: filteredPoolStats, isLoading, isError }
}
