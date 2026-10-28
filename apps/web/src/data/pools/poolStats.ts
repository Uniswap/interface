import { ProtocolVersion } from '@universe/api'
import { BIPS_BASE } from 'uniswap/src/constants/misc'
import { feeAmountToBps } from 'uniswap/src/features/fees/feeUnits'
import { getFeeBreakdown } from 'uniswap/src/features/fees/getFeeBreakdown'
import type { PoolData } from '~/data/pools/poolData'
import { OrderDirection } from '~/data/util'

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
 *
 * The last derived pool stat on the client: neither `PoolSummary` (GetPool) nor `PoolRankStats`
 * (ListPools) carries a 24h fee figure, so the two "24H fees" cells have nothing to read. Delete
 * this once the backend serves one — APR already comes served.
 *
 * @returns the fee amount, or `undefined` when volume or fee tier is unavailable, or the pool is a
 * dynamic-fee pool — its `feeTier` is the SDK's dynamic-fee sentinel, not a literal rate, and feeding
 * it through here as one produces a nonsensical (multi-hundred-percent) fee figure.
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

/** {@link calculate24hLpFeesUsd} for a served pool row, which carries every input itself. */
export function get24hLpFeesUsd(poolData: PoolData): number | undefined {
  return calculate24hLpFeesUsd({
    volume24h: poolData.volumeUSD24H,
    feeTier: poolData.feeTier?.feeAmount,
    isDynamic: poolData.feeTier?.isDynamic,
    protocolVersion: poolData.protocolVersion,
    protocolFeePips: poolData.protocolFeePips,
  })
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
