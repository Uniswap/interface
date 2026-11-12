import { PoolsOrderBy } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { UniverseChainId } from '@universe/chains'
import { DEFAULT_TICK_SPACING } from 'uniswap/src/constants/pools'
import { isToken0Quote } from 'uniswap/src/features/pools/quoteToken'
import { PoolSortFields } from '~/data/pools/poolStats'
import type { Pool } from '~/features/Liquidity/utils/pool'
import { getProtocolVersionLabel } from '~/features/Liquidity/utils/protocolVersion'
import type { PoolStat } from '~/types/explore'

export const poolSortFieldToOrderBy: Record<PoolSortFields, PoolsOrderBy> = {
  [PoolSortFields.TVL]: PoolsOrderBy.TVL,
  [PoolSortFields.Volume24h]: PoolsOrderBy.VOLUME_1D,
  [PoolSortFields.Volume30D]: PoolsOrderBy.VOLUME_30D,
  [PoolSortFields.Apr]: PoolsOrderBy.APR,
  // POOLS_ORDER_BY_APR ranks on total_apr (fee apr + reward apr), so it covers RewardApr sorting too.
  [PoolSortFields.RewardApr]: PoolsOrderBy.APR,
  [PoolSortFields.VolOverTvl]: PoolsOrderBy.VOLUME_1D_TVL_RATIO,
}

/**
 * Converts the canonical Pool to a PoolStat for the pool table. Every APR figure comes straight off
 * the ListPools row (backend#11679): `apr` is the LP-only fee APR, net of the protocol fee, and
 * `totalApr` is that plus the reward boosts, already summed server-side.
 */
export function convertPoolToPoolStat(pool: Pool): PoolStat {
  // Integer pips (backend#11679): additive on top of the LP fee for v4, a carve-out of the fee tier
  // for v2/v3, unset when unavailable.
  const protocolFeePips = pool.protocolFee
  const chainId = pool.chainId as UniverseChainId

  return {
    id: pool.poolId,
    chainId,
    protocolVersion: getProtocolVersionLabel(pool.protocolVersion),
    token0: {
      chainId,
      address: pool.token0Address || undefined,
      symbol: pool.token0Metadata?.symbol,
      name: pool.token0Metadata?.name,
      decimals: pool.token0Metadata?.decimals,
      logo: pool.token0Metadata?.logoUrl,
    },
    token1: {
      chainId,
      address: pool.token1Address || undefined,
      symbol: pool.token1Metadata?.symbol,
      name: pool.token1Metadata?.name,
      decimals: pool.token1Metadata?.decimals,
      logo: pool.token1Metadata?.logoUrl,
    },
    totalLiquidity: { value: pool.tvl },
    volume1Day: pool.volume1d !== undefined ? { value: pool.volume1d } : undefined,
    volume30Day: pool.volume30d !== undefined ? { value: pool.volume30d } : undefined,
    // The backend computes APR from the pool's real fee, so dynamic-fee pools get an actual rate
    // here — the client-side calculation had to zero them out (their feeTier is a sentinel).
    apr: pool.apr,
    totalApr: pool.totalApr,
    boostedApr: pool.rewardApr,
    rewards: pool.rewards,
    feeTier: {
      // Already the SDK's dynamic-fee sentinel for dynamic-fee pools — normalizeRankedPool
      // substitutes it for the raw max-fee constant ListPools serves.
      feeAmount: pool.feeTier,
      tickSpacing: pool.tickSpacing ?? DEFAULT_TICK_SPACING,
      isDynamic: pool.isDynamicFee,
    },
    volOverTvl: pool.volume1dTvlRatio,
    hookAddress: pool.hookAddress,
    protocolFeePips,
    currentLpFeePips: pool.currentLpFee,
    categoryIds: pool.categoryIds,
    isToken0Quote: isToken0Quote({ token0Address: pool.token0Address, quoteTokenAddress: pool.quoteTokenAddress }),
  } as PoolStat
}
