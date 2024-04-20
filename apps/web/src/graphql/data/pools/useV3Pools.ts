import { exploreSearchStringAtom } from 'components/Tokens/state'
import { OrderDirection } from 'graphql/data/util'
import { useAtomValue } from 'jotai/utils'
import { useMemo } from 'react'

import { useAllV3PoolsQuery, usePoolsBulkQuery } from '../../thegraph/__generated__/types-and-hooks'
import useBlocksFromTimestamp from '../../thegraph/BlocksFromTimestampQuery'
import { get2DayChange, useDeltaTimestamps } from '../util'

export interface TablePool {
  hash: string
  token0: PoolToken
  token1: PoolToken
  txCount: number
  tvl: number

  volumeChange: number
  volume24h: number
  volumeWeek: number

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  feeTier: any
}

interface PoolToken {
  id: string
  symbol: string
  name: string
}

interface PoolFields {
  id: string
  token0: PoolToken
  token1: PoolToken
  txCount: string
  volumeUSD: string
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  feeTier: any
  totalValueLockedUSD: string
}

export enum PoolSortFields {
  TVL = 'TVL',
  Volume24h = 'Volume 24H',
  VolumeWeek = 'Volume 7D',
  TxCount = 'Transactions',
}

export type PoolTableSortState = {
  sortBy: PoolSortFields
  sortDirection: OrderDirection
}

export function sortPools(pools: TablePool[], sortState: PoolTableSortState) {
  return pools.sort((a, b) => {
    switch (sortState.sortBy) {
      case PoolSortFields.TVL:
        return sortState.sortDirection === OrderDirection.Desc ? b.tvl - a.tvl : a.tvl - b.tvl
      case PoolSortFields.Volume24h:
        return sortState.sortDirection === OrderDirection.Desc ? b.volume24h - a.volume24h : a.volume24h - b.volume24h
      case PoolSortFields.VolumeWeek:
        return sortState.sortDirection === OrderDirection.Desc ? b.volumeWeek - a.volumeWeek : a.volumeWeek - b.volumeWeek
      default:
        return sortState.sortDirection === OrderDirection.Desc ? b.tvl - a.tvl : a.tvl - b.tvl
    }
  })
}
export function useV3Pools(sortState: PoolTableSortState): {
  loading: boolean
  error: boolean
  data: TablePool[]
} {
  const { data: allPools, error, loading } = useAllV3PoolsQuery()
  const pools = allPools?.pools.map((d) => d.id) ?? []
  // 获取三个时间间隔的 block number
  const [t24, t48, tWeek] = useDeltaTimestamps()
  const { data: block24, error: blockError24 } = useBlocksFromTimestamp(t24)
  const { data: block48, error: blockError48 } = useBlocksFromTimestamp(t48)
  const { data: blockWeek, error: blockErrorWeek } = useBlocksFromTimestamp(tWeek)

  const { data: data0, loading: loading0, error: error0 } = usePoolsBulkQuery({ variables: { ids: pools } })
  const { data: data24, loading: loading24, error: error24 } = usePoolsBulkQuery({ variables: { ids: pools, block: { number: block24 } } })
  const { data: data48, loading: loading48, error: error48 } = usePoolsBulkQuery({ variables: { ids: pools, block: { number: block48 } } })
  const { data: dataWeek, loading: loadingWeek, error: errorWeek } = usePoolsBulkQuery({ variables: { ids: pools, block: { number: blockWeek } } })

  const anyError = Boolean(error || error0 || blockError24 || blockError48 || blockErrorWeek || error24 || error48 || errorWeek)
  const anyLoading = Boolean(loading || loading0 || loading24 || loading48 || loadingWeek)

  // return early if not all data yet
  if (anyError || anyLoading) {
    return {
      loading: anyLoading,
      error: anyError,
      data: [],
    }
  }

  const parsed = data0?.pools
    ? data0.pools.reduce((accum: { [id: string]: PoolFields }, poolData) => {
        accum[poolData.id] = poolData
        return accum
      }, {})
    : {}
  const parsed24 = data24?.pools
    ? data24.pools.reduce((accum: { [id: string]: PoolFields }, poolData) => {
        accum[poolData.id] = poolData
        return accum
      }, {})
    : {}
  const parsed48 = data48?.pools
    ? data48.pools.reduce((accum: { [id: string]: PoolFields }, poolData) => {
        accum[poolData.id] = poolData
        return accum
      }, {})
    : {}
  const parsedWeek = dataWeek?.pools
    ? dataWeek.pools.reduce((accum: { [id: string]: PoolFields }, poolData) => {
        accum[poolData.id] = poolData
        return accum
      }, {})
    : {}

  const unsortedPools =
    pools?.map((address) => {
      const current: PoolFields | undefined = parsed[address]
      const oneDay: PoolFields | undefined = parsed24[address]
      const twoDay: PoolFields | undefined = parsed48[address]
      const week: PoolFields | undefined = parsedWeek[address]

      const [volumeUSD, volumeUSDChange] =
        current && oneDay && twoDay ? get2DayChange(current.volumeUSD, oneDay.volumeUSD, twoDay.volumeUSD) : current ? [Number.parseFloat(current.volumeUSD), 0] : [0, 0]
      const volumeUSDWeek = current && week ? Number.parseFloat(current.volumeUSD) - Number.parseFloat(week.volumeUSD) : current ? Number.parseFloat(current.volumeUSD) : 0

      const tvlUSD = current ? Number.parseFloat(current.totalValueLockedUSD) : 0
      const tvlUSDChange =
        current && oneDay
          ? ((Number.parseFloat(current.totalValueLockedUSD) - Number.parseFloat(oneDay.totalValueLockedUSD)) /
              Number.parseFloat(oneDay.totalValueLockedUSD === '0' ? '1' : oneDay.totalValueLockedUSD)) *
            100
          : 0

      return {
        hash: current.id,
        token0: current.token0,
        token1: current.token1,
        txCount: Number.parseInt(current.txCount),
        tvl: Number.parseInt(current.totalValueLockedUSD),
        tvlUSD: tvlUSD,
        tvlUSDChange: tvlUSDChange,
        volume24h: volumeUSD,
        volumeChange: volumeUSDChange,
        volumeWeek: volumeUSDWeek,
        feeTier: current.feeTier,
      } as TablePool
    }) ?? []

  const unfilteredPools = sortPools(unsortedPools, sortState)

  // const filteredPools = useFilteredPools(unfilteredPools).slice(0, 100)
  return { data: unfilteredPools, loading, error: anyError }
}
