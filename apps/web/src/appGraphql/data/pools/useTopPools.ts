import { OrderDirection } from 'appGraphql/data/util'
import { Percent } from '@uniswap/sdk-core'
import { GraphQLApi } from '@universe/api'
import { FeeData } from 'components/Liquidity/Create/types'
import { BIPS_BASE } from 'uniswap/src/constants/misc'

export function sortPools(pools: TablePool[], sortState: PoolTableSortState) {
  return pools.sort((a, b) => {
    switch (sortState.sortBy) {
      case PoolSortFields.VolOverTvl:
        return sortState.sortDirection === OrderDirection.Desc
          ? b.volOverTvl - a.volOverTvl
          : a.volOverTvl - b.volOverTvl
      case PoolSortFields.Volume24h:
        return sortState.sortDirection === OrderDirection.Desc ? b.volume24h - a.volume24h : a.volume24h - b.volume24h
      case PoolSortFields.Volume30D:
        return sortState.sortDirection === OrderDirection.Desc ? b.volume30d - a.volume30d : a.volume30d - b.volume30d
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
export function calculateApr({
  volume24h,
  tvl,
  feeTier,
}: {
  volume24h?: number
  tvl?: number
  feeTier?: number
}): Percent {
  if (!volume24h || !feeTier || !tvl || !Math.round(tvl)) {
    return new Percent(0)
  }
  return new Percent(Math.round(volume24h * (feeTier / (BIPS_BASE * 100)) * 365), Math.round(tvl))
}

export interface TablePool {
  hash: string
  token0: GraphQLApi.Token
  token1: GraphQLApi.Token
  tvl: number
  volume24h: number
  volume30d: number
  apr: Percent
  volOverTvl: number
  feeTier: FeeData
  protocolVersion: GraphQLApi.ProtocolVersion
  hookAddress?: string
  boostedApr?: number
}

export enum PoolSortFields {
  TVL = 'TVL',
  Apr = 'APR',
  RewardApr = 'Reward APR',
  Volume24h = '1 day volume',
  Volume30D = '30 day volume',
  VolOverTvl = '1 day volume/TVL',
}

export type PoolTableSortState = {
  sortBy: PoolSortFields
  sortDirection: OrderDirection
}
