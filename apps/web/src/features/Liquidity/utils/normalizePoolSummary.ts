import type { PlainMessage } from '@bufbuild/protobuf'
import { Message, toPlainMessage } from '@bufbuild/protobuf'
import type { PoolSummary } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import { DYNAMIC_FEE_AMOUNT } from 'uniswap/src/constants/pools'
import { protocolsToProtocolVersion } from '~/data/pools/protocolVersion'
import { INTEGER_STRING_REGEX, type Pool } from '~/features/Liquidity/utils/pool'

// Omitted rather than left `undefined` so a read of any of them here is a compile error, not a
// silent `undefined` a reader could mistake for "not loaded yet."
//
// The first four are `PoolRankStats` fields (data-api's ranked-pool/listing stats, populated by
// `normalizeRankedPool` instead) that liquidity-service v2 `PoolSummary` has no schema for — not
// gaps pending backend work. `rewardApr`/`rewards` are the opposite case: `PoolSummary.token_rewards`
// carries them, but every reward surface reads the rewards it renders off `PoolData` (via
// `parseLiquidityServicePool`), and the consumers of this shape are the liquidity-depth and
// order-book charts, which want onchain state. Populating a second, parallel copy here would leave
// two reward paths off one response to drift against each other for no reader's benefit.
export type PoolFromGetPool = Omit<
  Pool,
  'volume30d' | 'totalApr' | 'volume1dTvlRatio' | 'protocolFee' | 'rewardApr' | 'rewards'
>

/**
 * Adapts a liquidity-service v2 `PoolSummary` to the canonical `Pool` shape, minus the fields
 * `PoolSummary` has no schema for (see `PoolFromGetPool`).
 */
export function normalizePoolSummary(summary: PoolSummary | PlainMessage<PoolSummary>): PoolFromGetPool {
  const plain = summary instanceof Message ? toPlainMessage(summary) : summary
  return {
    poolId: plain.poolIdentifier,
    chainId: plain.chainId,
    // Persisted responses rehydrate protobuf enums as their name ("V4"); normalize to the numeric enum.
    protocolVersion: protocolsToProtocolVersion(plain.protocolVersion),
    token0Address: plain.token0Address,
    token1Address: plain.token1Address,
    token0Metadata: plain.token0Metadata,
    token1Metadata: plain.token1Metadata,
    feeTier: plain.feeTier,
    isDynamicFee: plain.isDynamicFee ?? plain.feeTier === DYNAMIC_FEE_AMOUNT,
    tickSpacing: plain.tickSpacing,
    hookAddress: plain.hookAddress,
    liquidity: plain.liquidity && INTEGER_STRING_REGEX.test(plain.liquidity) ? BigInt(plain.liquidity) : 0n,
    currentTick: plain.currentTick,
    sqrtPriceX96: plain.sqrtPriceX96,
    tvl: plain.tvlUsd,
    volume1d: plain.volumeUsd1d,
    apr: plain.apr,
    categoryIds: plain.categoryIds,
    quoteTokenAddress: plain.quoteTokenAddress,
  }
}
