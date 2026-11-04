import type { PlainMessage } from '@bufbuild/protobuf'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type {
  PoolSummary,
  PoolTokenRewards,
  RewardToken,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import { type Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { DEFAULT_TICK_SPACING, V2_DEFAULT_FEE_TIER } from 'uniswap/src/constants/pools'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { isUniverseChainId } from 'uniswap/src/features/chains/utils'
import { buildCurrency } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import type { ParsedToken } from 'uniswap/src/features/dataApi/utils/parsedToken'
import type { PoolData, RewardsCampaign } from '~/data/pools/poolData'
import { protocolsToProtocolVersion } from '~/data/pools/protocolVersion'

type PoolTokenMetadata = NonNullable<PoolSummary['token0Metadata']>

// token_supply is a uint256 raw base-unit amount, not decimal-adjusted. Convert via CurrencyAmount so
// the raw uint256 scales down exactly — Number(rawUint256) would lose precision past 2^53.
function scaleTokenSupply({
  chainId,
  address,
  supply,
  metadata,
}: {
  chainId: UniverseChainId
  address: string
  supply?: string
  metadata?: PoolTokenMetadata
}): number | undefined {
  if (!supply) {
    return undefined
  }
  const currency =
    address === ZERO_ADDRESS ? nativeOnChain(chainId) : new Token(chainId, address, metadata?.decimals ?? 18)
  return Number(CurrencyAmount.fromRawAmount(currency, supply).toExact())
}

// GetPool doesn't carry USD prices, so pricing is intentionally absent from the token.
function buildPoolToken({
  chainId,
  address,
  metadata,
}: {
  chainId: UniverseChainId
  address: string
  metadata?: PoolTokenMetadata
}): ParsedToken {
  return {
    chainId,
    // Absent address is the parsed shape's native representation.
    address: address === ZERO_ADDRESS ? undefined : address,
    decimals: metadata?.decimals ?? 18,
    symbol: metadata?.symbol,
    name: metadata?.name,
    logoUrl: metadata?.logoUrl,
  }
}

/**
 * Builds the currency a campaign's reward amounts are denominated in, on its own distribution
 * chain (which can differ from the pool's).
 *
 * Undefined when the served token can't be built. No stand-in: substituting one here would scale
 * and price the campaign's raw amounts by another token's decimals, so callers drop them instead.
 */
export function buildRewardCurrency(rewardToken?: PlainMessage<RewardToken>): Currency | undefined {
  if (!rewardToken || !isUniverseChainId(rewardToken.chainId)) {
    return undefined
  }
  const { chainId, address, decimals, symbol, name, isNative } = rewardToken
  // Short-circuited rather than left to `buildCurrency`, which requires decimals up front: a native
  // currency's are a property of the chain, so the server has no reason to send them.
  if (isNative) {
    return nativeOnChain(chainId)
  }

  return buildCurrency({ chainId, address, decimals, symbol, name })
}

/**
 * Maps the pool's live LP-incentive rewards onto the single campaign shape the PDP renders.
 *
 * Only the first reward token is surfaced. A pool can run campaigns in several tokens; the surfaces
 * that want the full set read the raw `rewardTokens` carried alongside this (the pool info card's
 * per-token boost rows), so this stays the single-campaign shape the PDP was built around.
 *
 * `boostedApr` is the token's summed live-campaign APR (`PoolTokenRewards.boostedApr`), while the
 * window and allocation describe its first campaign alone. Those agree while a token runs one
 * campaign, which is the case this collapses to; they would diverge under concurrent ones.
 */
function parsePoolRewards(pool: PoolSummary): RewardsCampaign | undefined {
  // Typed as always-present, but protobuf JSON omits empty repeated fields — so this is absent in
  // practice for a pool running no campaign, and on entries persisted before the field existed.
  const served = pool.tokenRewards as PoolSummary['tokenRewards'] | undefined

  // `.at()` rather than indexing: it reports the empty case as undefined, which destructuring
  // doesn't under this tsconfig (no `noUncheckedIndexedAccess`).
  const tokenRewards = served?.at(0)
  if (!tokenRewards || tokenRewards.boostedApr <= 0) {
    return undefined
  }
  // Same omitted-when-empty caveat as `tokenRewards` itself.
  const servedCampaigns = tokenRewards.campaigns as PoolTokenRewards['campaigns'] | undefined
  const campaign = servedCampaigns?.at(0)
  const token = buildRewardCurrency(tokenRewards.token)

  return {
    id: campaign?.id,
    boostedApr: tokenRewards.boostedApr,
    token,
    // Unix seconds as int64; Number() is safe, both are far below MAX_SAFE_INTEGER.
    startTimestamp: campaign ? Number(campaign.startTimestamp) : undefined,
    endTimestamp: campaign ? Number(campaign.endTimestamp) : undefined,
    // Raw base units of the served token, so they're uninterpretable without one: read at any other
    // token's decimals they'd scale and price as a different amount entirely.
    totalRewardAllocation: token ? campaign?.totalRewardAllocation : undefined,
    // An upstream estimate, not a settled figure: Merkl reports nothing per-campaign, so the server
    // prorates the allocation by the elapsed window. The distribution bar therefore tracks the time
    // bar, and won't reconcile against onchain claims.
    distributedRewards: token ? campaign?.distributedRewards : undefined,
  }
}

/**
 * Maps a liquidity-service `GetPool` `PoolSummary` into the `PoolData` shape the Pool Details Page
 * consumes.
 */
export function parseLiquidityServicePool(pool: PoolSummary, chainId: UniverseChainId): PoolData {
  // UNSPECIFIED → undefined so downstream `?? V3` fallbacks on the optional field still engage.
  const protocolVersion = protocolsToProtocolVersion(pool.protocolVersion)
  return {
    idOrAddress: pool.poolIdentifier,
    protocolVersion: protocolVersion === ProtocolVersion.UNSPECIFIED ? undefined : protocolVersion,
    // GetPool returns the zero address for a hookless V4 pool. Normalize to undefined so the PDP
    // doesn't surface a spurious hook.
    hookAddress: pool.hookAddress && pool.hookAddress !== ZERO_ADDRESS ? pool.hookAddress : undefined,
    token0: buildPoolToken({ chainId, address: pool.token0Address, metadata: pool.token0Metadata }),
    tvlToken0: scaleTokenSupply({
      chainId,
      address: pool.token0Address,
      supply: pool.token0Supply,
      metadata: pool.token0Metadata,
    }),
    token0Price: pool.token0PriceUsd ? Number(pool.token0PriceUsd) : undefined,
    token1: buildPoolToken({ chainId, address: pool.token1Address, metadata: pool.token1Metadata }),
    tvlToken1: scaleTokenSupply({
      chainId,
      address: pool.token1Address,
      supply: pool.token1Supply,
      metadata: pool.token1Metadata,
    }),
    token1Price: pool.token1PriceUsd ? Number(pool.token1PriceUsd) : undefined,
    feeTier: {
      // V2 has no onchain fee tier — it's always 0.30%, so backfill the constant. For v3/v4 trust the
      // served tier verbatim, INCLUDING a legitimate 0 (a v4 pool whose swap fee is taken by a hook)
      // and the dynamic-fee sentinel: `feeTier` is a plain proto3 scalar, so `|| V2_DEFAULT_FEE_TIER`
      // would fabricate a 0.30% tier for a 0-fee pool and inflate every fee/APR figure derived from it.
      feeAmount: protocolVersion === ProtocolVersion.V2 ? V2_DEFAULT_FEE_TIER : pool.feeTier,
      tickSpacing: pool.tickSpacing ?? DEFAULT_TICK_SPACING,
      isDynamic: pool.isDynamicFee ?? false,
    },
    volumeUSD24H: pool.volumeUsd1d,
    volumeUSD24HChange: pool.volumeUsd1dChange,
    tvlUSD: pool.tvlUsd,
    tvlUSDChange: pool.tvlUsdChange1d,
    rewardsCampaign: parsePoolRewards(pool),
    rewardTokens: pool.tokenRewards,
    apr: pool.apr,
    totalApr: pool.totalApr,
    protocolFeePips: pool.protocolFee,
    categoryIds: pool.categoryIds,
  }
}
