import { Percent } from '@uniswap/sdk-core'
import { exploreSearchStringAtom } from 'components/Tokens/state'
import { SupportedInterfaceChainId, chainIdToBackendChain } from 'constants/chains'
import { OrderDirection } from 'graphql/data/util'
import useIsWindowVisible from 'hooks/useIsWindowVisible'
import { useAtomValue } from 'jotai/utils'
import { useMemo } from 'react'
import { BIPS_BASE } from 'uniswap/src/constants/misc'
import {
  ProtocolVersion,
  Token,
  useTopV2PairsQuery,
  useTopV3PoolsQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

export function sortPools(pools: TablePool[], sortState: PoolTableSortState) {
  return pools.sort((a, b) => {
    switch (sortState.sortBy) {
      case PoolSortFields.VolOverTvl:
        return sortState.sortDirection === OrderDirection.Desc
          ? b.volOverTvl - a.volOverTvl
          : a.volOverTvl - b.volOverTvl
      case PoolSortFields.Volume24h:
        return sortState.sortDirection === OrderDirection.Desc ? b.volume24h - a.volume24h : a.volume24h - b.volume24h
      case PoolSortFields.VolumeWeek:
        return sortState.sortDirection === OrderDirection.Desc
          ? b.volumeWeek - a.volumeWeek
          : a.volumeWeek - b.volumeWeek
      case PoolSortFields.Apr:
        return sortState.sortDirection === OrderDirection.Desc
          ? b.apr.greaterThan(a.apr)
            ? 1
            : -1
          : a.apr.greaterThan(b.apr)
            ? 1
            : -1
      default:
        return sortState.sortDirection === OrderDirection.Desc ? b.tvl - a.tvl : a.tvl - b.tvl
    }
  })
}

export function calculate1DVolOverTvl(volume24h: number | undefined, tvl: number | undefined): number | undefined {
  if (!volume24h || !tvl) {
    return undefined
  }

  return volume24h / tvl
}

/**
 * Calculate the APR of a pool/pair which is the ratio of 24h fees to TVL expressed as a percent (1 day APR) multiplied by 365
 * @param volume24h the 24h volume of the pool/pair
 * @param tvl the pool/pair's TVL
 * @param feeTier the feeTier of the pool or 300 for a v2 pair
 * @returns APR expressed as a percent
 */
export function calculateApr(volume24h?: number, tvl?: number, feeTier?: number): Percent {
  if (!volume24h || !feeTier || !tvl || !Math.round(tvl)) {
    return new Percent(0)
  }
  return new Percent(Math.round(volume24h * (feeTier / (BIPS_BASE * 100)) * 365), Math.round(tvl))
}

export const V2_BIPS = 3000

export interface TablePool {
  hash: string
  token0: Token
  token1: Token
  tvl: number
  volume24h: number
  volumeWeek: number // TODO(WEB-4856): Update to 30 day when the data is available
  apr: Percent
  volOverTvl: number
  feeTier: number
  protocolVersion: ProtocolVersion
  // TODO(WEB-4612): add hook information
}

export enum PoolSortFields {
  TVL = 'TVL',
  Apr = 'APR',
  Volume24h = '1 day volume',
  VolumeWeek = '7 day volume', // TODO(WEB-4856): Update to 30 day when the data is available
  VolOverTvl = '1 day volume/TVL',
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
    [lowercaseFilterString, pools],
  )
}

export function useTopPools(sortState: PoolTableSortState, chainId?: SupportedInterfaceChainId) {
  const isWindowVisible = useIsWindowVisible()
  const isRestExploreEnabled = useFeatureFlag(FeatureFlags.RestExplore)
  const {
    loading: loadingV3,
    error: errorV3,
    data: dataV3,
  } = useTopV3PoolsQuery({
    variables: { first: 100, chain: chainIdToBackendChain({ chainId, withFallback: true }) },
    skip: !isWindowVisible || isRestExploreEnabled,
  })
  const {
    loading: loadingV2,
    error: errorV2,
    data: dataV2,
  } = useTopV2PairsQuery({
    variables: { first: 100, chain: chainIdToBackendChain({ chainId, withFallback: true }) },
    skip: !isWindowVisible || !chainId || isRestExploreEnabled,
  })
  const loading = loadingV3 || loadingV2

  const unfilteredPools = useMemo(() => {
    // TODO(WEB-4818): add v4 pools here
    const topV3Pools: TablePool[] =
      dataV3?.topV3Pools?.map((pool) => {
        return {
          hash: pool.address,
          token0: pool.token0,
          token1: pool.token1,
          tvl: pool.totalLiquidity?.value,
          volume24h: pool.volume24h?.value,
          volumeWeek: pool.volumeWeek?.value,
          apr: calculateApr(pool.volume24h?.value, pool.totalLiquidity?.value, pool.feeTier),
          volOverTvl: calculate1DVolOverTvl(pool.volume24h?.value, pool.totalLiquidity?.value),
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
          tvl: pool.totalLiquidity?.value,
          volume24h: pool.volume24h?.value,
          volumeWeek: pool.volumeWeek?.value,
          volOverTvl: calculate1DVolOverTvl(pool.volume24h?.value, pool.totalLiquidity?.value),
          apr: calculateApr(pool.volume24h?.value, pool.totalLiquidity?.value, V2_BIPS),
          feeTier: V2_BIPS,
          protocolVersion: pool.protocolVersion,
        } as TablePool
      }) ?? []

    return sortPools([...topV3Pools, ...topV2Pairs], sortState)
  }, [dataV2?.topV2Pairs, dataV3?.topV3Pools, sortState])

  const filteredPools = useFilteredPools(unfilteredPools).slice(0, 100)
  return { topPools: filteredPools, loading, errorV3, errorV2 }
}
