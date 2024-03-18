import { ChainId, Percent } from '@uniswap/sdk-core'
import { exploreSearchStringAtom } from 'components/Tokens/state'
import { BIPS_BASE } from 'constants/misc'
import {
  ProtocolVersion,
  Token,
  useTopV2PairsQuery,
  useTopV3PoolsQuery,
} from 'graphql/data/__generated__/types-and-hooks'
import { OrderDirection, chainIdToBackendName } from 'graphql/data/util'
import { useAtomValue } from 'jotai/utils'
import { useMemo } from 'react'

export function sortPools(pools: TablePool[], sortState: PoolTableSortState) {
  return pools.sort((a, b) => {
    switch (sortState.sortBy) {
      case PoolSortFields.TxCount:
        return sortState.sortDirection === OrderDirection.Desc ? b.txCount - a.txCount : a.txCount - b.txCount
      case PoolSortFields.Volume24h:
        return sortState.sortDirection === OrderDirection.Desc ? b.volume24h - a.volume24h : a.volume24h - b.volume24h
      case PoolSortFields.VolumeWeek:
        return sortState.sortDirection === OrderDirection.Desc
          ? b.volumeWeek - a.volumeWeek
          : a.volumeWeek - b.volumeWeek
      case PoolSortFields.Turnover:
        return sortState.sortDirection === OrderDirection.Desc
          ? b.turnover.greaterThan(a.turnover)
            ? 1
            : -1
          : a.turnover.greaterThan(b.turnover)
          ? 1
          : -1
      default:
        return sortState.sortDirection === OrderDirection.Desc ? b.tvl - a.tvl : a.tvl - b.tvl
    }
  })
}

/**
 * Calculate the turnover of a pool/pair which is the ratio of 24h fees to TVL expressed as a percent
 * @param volume24h the 24h volume of the pool/pair
 * @param tvl the pool/pair's TVL
 * @param feeTier the feeTier of the pool or 300 for a v2 pair
 * @returns turnover expressed as a percent
 */
export function calculateTurnover(volume24h?: number, tvl?: number, feeTier?: number): Percent {
  if (!volume24h || !feeTier || !tvl || !Math.round(tvl)) return new Percent(0)
  return new Percent(Math.round(volume24h * (feeTier / BIPS_BASE)), Math.round(tvl))
}

export const V2_BIPS = 3000

export interface TablePool {
  hash: string
  token0: Token
  token1: Token
  txCount: number
  tvl: number
  volume24h: number
  volumeWeek: number
  turnover: Percent
  feeTier: number
  protocolVersion: ProtocolVersion
}

export enum PoolSortFields {
  TVL = 'TVL',
  Volume24h = '1 day volume',
  VolumeWeek = '7 day volume',
  Turnover = 'Turnover',
  TxCount = 'Transactions',
}

export type PoolTableSortState = {
  sortBy: PoolSortFields
  sortDirection: OrderDirection
}

function useFilteredPools(pools: TablePool[]) {
  const filterString = useAtomValue(exploreSearchStringAtom)

  const lowercaseFilterString = useMemo(() => filterString.toLowerCase(), [filterString])

  return useMemo(
    () =>
      pools.filter((pool) => {
        const addressIncludesFilterString = pool.hash.toLowerCase().includes(lowercaseFilterString)
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
    [lowercaseFilterString, pools]
  )
}

export function useTopPools(sortState: PoolTableSortState, chainId?: ChainId) {
  const {
    loading: loadingV3,
    error: errorV3,
    data: dataV3,
  } = useTopV3PoolsQuery({
    variables: { first: 100, chain: chainIdToBackendName(chainId) },
  })
  const {
    loading: loadingV2,
    error: errorV2,
    data: dataV2,
  } = useTopV2PairsQuery({
    variables: { first: 100 },
    skip: chainId !== ChainId.MAINNET,
  })
  const loading = loadingV3 || loadingV2
  const error = errorV3 || errorV2

  const unfilteredPools = useMemo(() => {
    const topV3Pools: TablePool[] =
      dataV3?.topV3Pools?.map((pool) => {
        return {
          hash: pool.address,
          token0: pool.token0,
          token1: pool.token1,
          txCount: pool.txCount,
          tvl: pool.totalLiquidity?.value,
          volume24h: pool.volume24h?.value,
          volumeWeek: pool.volumeWeek?.value,
          turnover: calculateTurnover(pool.volume24h?.value, pool.totalLiquidity?.value, pool.feeTier),
          feeTier: pool.feeTier,
          protocolVersion: pool.protocolVersion,
        } as TablePool
      }) ?? []
    const topV2Pairs: TablePool[] =
      dataV2?.topV2Pairs?.map((pool) => {
        return {
          hash: pool.address,
          token0: pool.token0,
          token1: pool.token1,
          txCount: pool.txCount,
          tvl: pool.totalLiquidity?.value,
          volume24h: pool.volume24h?.value,
          volumeWeek: pool.volumeWeek?.value,
          turnover: calculateTurnover(pool.volume24h?.value, pool.totalLiquidity?.value, V2_BIPS),
          feeTier: V2_BIPS,
          protocolVersion: pool.protocolVersion,
        } as TablePool
      }) ?? []

    return sortPools([...topV3Pools, ...topV2Pairs], sortState)
  }, [dataV2?.topV2Pairs, dataV3?.topV3Pools, sortState])

  const filteredPools = useFilteredPools(unfilteredPools).slice(0, 100)
  return { topPools: filteredPools, loading, error }
}
