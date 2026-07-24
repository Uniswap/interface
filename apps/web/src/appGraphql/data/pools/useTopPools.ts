import { Percent } from '@uniswap/sdk-core'
import { GraphQLApi, ProtocolVersion } from '@universe/api'
import { BIPS_BASE } from 'uniswap/src/constants/misc'
import type { FeeData } from 'uniswap/src/features/positions/types'
import { OrderDirection } from '~/appGraphql/data/util'

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
 * Fraction of the swap fee that LPs keep after the protocol fee is deducted.
 *
 * The protocol fee switch is enabled and currently follows a uniform schedule (verified on-chain
 * across mainnet/Base/Arbitrum/Optimism/Polygon, LP-767):
 *   - v2: protocol takes 1/6 -> LPs keep 5/6
 *   - v3 tiers 100/500 (0.01%/0.05%): protocol takes 1/4 -> LPs keep 3/4
 *   - v3 tiers 3000/10000 (0.30%/1.00%): protocol takes 1/6 -> LPs keep 5/6
 *   - v4: no protocol fee yet -> LPs keep everything
 *
 * NOTE: `feeProtocol` is a per-pool on-chain setting, so this schedule is an approximation
 * (e.g. it can't detect pools where the fee was never enabled, or non-mainnet variance). Single-pool
 * surfaces read the real per-pool value on-chain via `usePoolLpFeeFraction`; list surfaces (Explore,
 * token pool lists) use this schedule until the value is exposed on the pool endpoints.
 *
 * TODO(LP-995, owner @christine.legge): replace this stopgap schedule with the real per-pool
 * protocol fee once the new data-api pool endpoints expose it — feed the value into `calculateApr`'s
 * `lpFeeFraction`. The data already exists in the backend (Aurora `v{2,3,4}_pool_metadata.protocol_fee`).
 * @param protocolVersion the pool's protocol version
 * @param feeTier the total fee tier in hundredths of a bip (e.g. 3000 = 0.30%)
 * @returns the LP fee fraction in [0, 1]
 */
export function getLpFeeFraction(protocolVersion?: ProtocolVersion, feeTier?: number): number {
  switch (protocolVersion) {
    case ProtocolVersion.V2:
      return 5 / 6
    case ProtocolVersion.V3:
      return feeTier === 100 || feeTier === 500 ? 3 / 4 : 5 / 6
    default:
      // v4 (no protocol fee yet), UNSPECIFIED, or unknown version
      return 1
  }
}

/**
 * Calculate the APR of a pool/pair which is the ratio of 24h LP fees to TVL expressed as a percent
 * (1 day APR) multiplied by 365. Only the LP portion of fees is counted; the protocol fee is excluded.
 * @param volume24h the 24h volume of the pool/pair
 * @param tvl the pool/pair's TVL
 * @param feeTier the feeTier of the pool or 300 for a v2 pair
 * @param protocolVersion the pool's protocol version, used to derive the LP fee fraction from the schedule
 * @param lpFeeFraction explicit LP fee fraction (e.g. read on-chain); overrides the schedule when provided
 * @returns APR expressed as a percent (LP portion only, excluding protocol fees)
 */
export function calculateApr({
  volume24h,
  tvl,
  feeTier,
  protocolVersion,
  lpFeeFraction,
}: {
  volume24h?: number
  tvl?: number
  feeTier?: number
  protocolVersion?: ProtocolVersion
  lpFeeFraction?: number
}): Percent {
  if (!volume24h || !feeTier || !tvl || !Math.round(tvl)) {
    return new Percent(0)
  }
  const fraction = lpFeeFraction ?? getLpFeeFraction(protocolVersion, feeTier)
  return new Percent(Math.round(volume24h * (feeTier / (BIPS_BASE * 100)) * fraction * 365), Math.round(tvl))
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
