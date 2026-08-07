import { Percent } from '@uniswap/sdk-core'
import { GraphQLApi, ProtocolVersion } from '@universe/api'
import { BIPS_BASE } from 'uniswap/src/constants/misc'
import { feeAmountToBps } from 'uniswap/src/features/fees/feeUnits'
import { getFeeBreakdown } from 'uniswap/src/features/fees/getFeeBreakdown'
import type { FeeData } from 'uniswap/src/features/positions/types'
import { OrderDirection } from '~/data/util'

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

export interface PoolFeeArgs {
  /** The feeTier of the pool in hundredths of a bip (pips), or the v2 default tier for a v2 pair. */
  feeTier?: number
  /** True when the pool is a v4 dynamic-fee pool, whose `feeTier` is a sentinel, not a literal rate. */
  isDynamic?: boolean
  protocolVersion?: ProtocolVersion
  /** The backend-served per-pool protocol fee (integer pips); absent => gross (no deduction). */
  protocolFeePips?: number
}

/**
 * 24h LP fees in USD: volume × the LP's share of the swap fee, excluding the backend-served protocol
 * fee. getFeeBreakdown does the split (v2/v3 carve it out of the tier, v4 stacks it on top); an absent
 * served value falls back to the full tier (gross).
 * @returns the fee amount, or `undefined` when volume or fee tier is unavailable, or the pool is a
 * dynamic-fee pool — its `feeTier` is the SDK's dynamic-fee sentinel, not a literal rate, and feeding
 * it through here as one produces a nonsensical (multi-hundred-percent) fee/APR figure.
 */
export function calculate24hLpFeesUsd({
  volume24h,
  feeTier,
  isDynamic,
  protocolVersion,
  protocolFeePips,
}: PoolFeeArgs & { volume24h?: number }): number | undefined {
  if (volume24h === undefined || feeTier === undefined || isDynamic) {
    return undefined
  }
  const { lpFeeBps } = getFeeBreakdown({
    feeAmount: feeTier,
    protocolVersion: protocolVersion ?? ProtocolVersion.UNSPECIFIED,
    servedProtocolFeeBps: protocolFeePips !== undefined ? feeAmountToBps(protocolFeePips) : undefined,
  })
  return (volume24h * lpFeeBps) / BIPS_BASE
}

/**
 * Pool/pair APR: 24h LP fees over TVL, annualized (×365). Only the LP portion is counted — the
 * protocol fee is excluded via {@link calculate24hLpFeesUsd}.
 * @returns the APR, `0%` when volume/fees/TVL are unavailable, or `undefined` for a dynamic-fee
 * pool — mirroring {@link calculate24hLpFeesUsd}'s `isDynamic` short-circuit so both figures fall
 * back together instead of pairing a blank fees cell with a definite "0.00%" APR.
 */
export function calculateApr({
  volume24h,
  tvl,
  ...feeArgs
}: PoolFeeArgs & { volume24h?: number; tvl?: number }): Percent | undefined {
  const fees24h = calculate24hLpFeesUsd({ volume24h, ...feeArgs })
  if (fees24h === undefined || !tvl || !Math.round(tvl)) {
    return feeArgs.isDynamic ? undefined : new Percent(0)
  }
  return new Percent(Math.round(fees24h * 365), Math.round(tvl))
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
  /** Backend-served per-pool protocol fee (integer pips); shared with the fee-display column. */
  protocolFeePips?: number
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
