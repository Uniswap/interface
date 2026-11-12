import type { PlainMessage } from '@bufbuild/protobuf'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { RankedPool, Token } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { toTokenBoostRewardAprEntries } from '~/features/Liquidity/LPIncentives/utils'
import { INTEGER_STRING_REGEX, normalizeTvl, type Pool, type PoolTokenMetadata } from '~/features/Liquidity/utils/pool'
import { toProtocolVersion } from '~/features/Liquidity/utils/protocolVersion'

function toTokenMetadata(token: Token | PlainMessage<Token> | undefined): PoolTokenMetadata | undefined {
  if (!token) {
    return undefined
  }
  return { symbol: token.symbol, name: token.name, decimals: token.decimals, logoUrl: token.project?.logoUrl }
}

/**
 * Adapts a data.v2 `ListPools` item (`RankedPool`) to the canonical `Pool` shape. Served fields pass
 * through as-is; only proto3 zero-defaults that are never valid (an unset `tickSpacing` arriving as
 * 0) are normalized to undefined. Returns undefined when the pool is missing or its protocol version
 * is unspecified.
 */
export function normalizeRankedPool(rankedPool: RankedPool | PlainMessage<RankedPool>): Pool | undefined {
  const { pool, stats } = rankedPool
  if (!pool) {
    return undefined
  }
  const dataProtocolVersion = toProtocolVersion(pool.protocolVersion)
  if (dataProtocolVersion === ProtocolVersion.UNSPECIFIED) {
    return undefined
  }

  return {
    poolId: pool.poolId,
    chainId: pool.chainId,
    protocolVersion: dataProtocolVersion,
    token0Address: pool.token0?.address ?? '',
    token1Address: pool.token1?.address ?? '',
    token0Metadata: toTokenMetadata(pool.token0),
    token1Metadata: toTokenMetadata(pool.token1),
    // Served for every protocol version: the pool key's fee for v4 dynamic pools (which
    // V4Pool.getPoolId and the v4-sdk constructor both require) and the fixed 0.30% for V2 pairs.
    // Consumers gate on `feeTier !== undefined`, so if V2 pairs or dynamic pools ever drop out of
    // the fee-tier grid or the TVL denominator, the serializer stopped populating fee_tier.
    feeTier: pool.feeTier,
    isDynamicFee: pool.isDynamicFee,
    currentLpFee: pool.currentLpFee,
    // Same proto3 reasoning as `feeTier` above: an unserved tick spacing arrives as 0, and 0 is
    // never a valid spacing (it must be >= 1). Normalized to undefined so the consumer's fallback
    // fires rather than a bogus 0 reaching tick math or the v4 pool-id hash.
    tickSpacing: pool.tickSpacing || undefined,
    hookAddress: pool.hookAddress,
    tvl: normalizeTvl(stats?.tvl ?? 0),
    volume1d: stats?.volume1d,
    volume30d: stats?.volume30d,
    apr: stats?.apr,
    rewardApr: stats?.rewardApr,
    // The tokens `rewardApr` is paid in, one entry per token. The backend derives `rewardApr` from
    // these, so the two are never populated one without the other.
    rewards: toTokenBoostRewardAprEntries(stats?.tokenBoosts),
    totalApr: stats?.totalApr,
    volume1dTvlRatio: stats?.volume1dTvlRatio,
    // Onchain state (V3/V4 only; absent until a state row is indexed for the pool).
    currentTick: pool.currentTick,
    sqrtPriceX96: pool.sqrtPriceX96,
    liquidity: pool.liquidity && INTEGER_STRING_REGEX.test(pool.liquidity) ? BigInt(pool.liquidity) : 0n,
    // Populated by the backend on a best-effort basis (backend#11679): unset when per-pool fee
    // enrichment fails, in which case consumers treat the protocol fee as unavailable.
    protocolFee: pool.protocolFee,
    categoryIds: pool.categoryIds,
    quoteTokenAddress: pool.quoteTokenAddress,
  }
}
