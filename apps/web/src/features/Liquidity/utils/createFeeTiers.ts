import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Percent } from '@uniswap/sdk-core'
import { getCreateTierFeeBreakdown } from 'uniswap/src/features/fees/feeCurve'
import { DEFAULT_FEE_TIER_PAIRS, getPairedNewFeeTierBps } from 'uniswap/src/features/fees/feeTiers'
import { bpsToFeeAmount, feeAmountToBps } from 'uniswap/src/features/fees/feeUnits'
import { getFeeBreakdown } from 'uniswap/src/features/fees/getFeeBreakdown'
import type { FeeBreakdown } from 'uniswap/src/features/fees/types'
import type { FeeData } from 'uniswap/src/features/positions/types'
import { PercentNumberDecimals } from 'utilities/src/format/types'
import { BIPS_BASE } from '~/constants/misc'
import {
  calculateTickSpacingFromFeeAmount,
  type FeeTierOption,
  getFeeTierTitle,
  isDynamicFeeTier,
  type L2TickSpacingConfig,
  MAX_FEE_TIER_DECIMALS,
} from '~/features/Liquidity/utils/feeTiers'
import { FeeTierData } from '~/types/liquidity'

// Post-cutover the canonical v4 tiers are the new lower ones; an old tier is shown only when its pool
// already holds at least this much liquidity (USD), so we keep users in that deep pool instead of
// fragmenting liquidity into a parallel new-tier pool. Spec: "Same-tier pool handling (v4 only)".
const KEEP_EXISTING_TIER_MIN_TVL = 5000

/** FeeData for a not-yet-created tier given its LP fee in bps (tick spacing derived from the fee). */
function feeDataFromBps(bps: number, l2TickSpacingConfig: L2TickSpacingConfig): FeeData {
  const feeAmount = bpsToFeeAmount(bps)
  return { isDynamic: false, feeAmount, tickSpacing: calculateTickSpacingFromFeeAmount(feeAmount, l2TickSpacingConfig) }
}

/** The existing non-dynamic pool at a fee tier, matched by fee amount. */
function poolAtFee(feeTierData: Record<string, FeeTierData>, feeAmount: number): FeeTierData | undefined {
  return Object.values(feeTierData).find((data) => !isDynamicFeeTier(data.fee) && data.fee.feeAmount === feeAmount)
}

/** A pool's served protocol fee (a raw fee amount) in bps, or undefined when the backend didn't serve one. */
function protocolFeeToBps(protocolFee: number | undefined): number | undefined {
  return protocolFee === undefined ? undefined : feeAmountToBps(protocolFee)
}

/**
 * v4 effective-rate breakdown for a create-flow tier: from the pool's served protocol fee when a pool
 * already exists at the tier, else derived from the governance curve (exact for vanilla, unavailable for
 * hooked). The FE only computes fees here — for a not-yet-created vanilla pool the curve is deterministic.
 */
function v4Breakdown({
  feeAmount,
  pool,
  hook,
}: {
  feeAmount: number
  pool: FeeTierData | undefined
  hook: string | undefined
}): FeeBreakdown {
  if (!pool) {
    return getCreateTierFeeBreakdown({ feeAmount, protocolVersion: ProtocolVersion.V4, hook })
  }
  return getFeeBreakdown({
    feeAmount,
    protocolVersion: ProtocolVersion.V4,
    servedProtocolFeeBps: protocolFeeToBps(pool.protocolFee),
  })
}

/**
 * Resolve one canonical new↔old pairing to the tier the v4 create flow shows: the new tier by default
 * (canonical post-cutover), or the old tier when its pool already holds >= {@link
 * KEEP_EXISTING_TIER_MIN_TVL} so we don't fragment that liquidity. `pool` is the backing pool when one
 * exists (a deep old pool, or a pool already sitting at the new tier), else undefined (curve breakdown).
 */
function resolveCanonicalTier({
  pair,
  feeTierData,
  l2TickSpacingConfig,
}: {
  pair: { newBps: number; oldBps: number }
  feeTierData: Record<string, FeeTierData>
  l2TickSpacingConfig: L2TickSpacingConfig
}): { feeData: FeeData; pool: FeeTierData | undefined } {
  const oldPool = poolAtFee(feeTierData, bpsToFeeAmount(pair.oldBps))
  if (oldPool && (parseFloat(oldPool.tvl) || 0) >= KEEP_EXISTING_TIER_MIN_TVL) {
    return { feeData: oldPool.fee, pool: oldPool }
  }
  const newPool = poolAtFee(feeTierData, bpsToFeeAmount(pair.newBps))
  return { feeData: newPool?.fee ?? feeDataFromBps(pair.newBps, l2TickSpacingConfig), pool: newPool }
}

/**
 * The v4 fee tier to pre-select in the create flow: the most-used existing tier, steered to its paired
 * new tier when that most-used tier is a shallow canonical default — so the pre-selection matches a
 * rendered card (a shallow old default isn't shown; its new tier is). Deep/non-default tiers are kept.
 */
export function getSteeredRecommendedFee({
  mostUsedFee,
  tvl,
  l2TickSpacingConfig,
}: {
  mostUsedFee: FeeData
  tvl: string | undefined
  l2TickSpacingConfig: L2TickSpacingConfig
}): FeeData {
  const pairedNewBps = getPairedNewFeeTierBps(feeAmountToBps(mostUsedFee.feeAmount))
  if (pairedNewBps !== undefined && (parseFloat(tvl ?? '') || 0) < KEEP_EXISTING_TIER_MIN_TVL) {
    return feeDataFromBps(pairedNewBps, l2TickSpacingConfig)
  }
  return mostUsedFee
}

/**
 * Attach a v2/v3 fee breakdown to an option so it renders the LP fee + protocol/all-in hover tooltip.
 * Served when a pool already exists at the tier, else derived from the subtractive fee-switch schedule
 * for the not-yet-created pool — the create-flow analog of the v4 curve fallback in {@link v4Breakdown}.
 */
function withSubtractiveFeeBreakdown(tier: FeeTierOption, protocolVersion: ProtocolVersion): FeeTierOption {
  if (tier.feeBreakdown || isDynamicFeeTier(tier.value)) {
    return tier
  }
  const servedProtocolFeeBps = protocolFeeToBps(tier.protocolFee)
  return {
    ...tier,
    feeBreakdown:
      servedProtocolFeeBps === undefined
        ? getCreateTierFeeBreakdown({ feeAmount: tier.value.feeAmount, protocolVersion })
        : getFeeBreakdown({ feeAmount: tier.value.feeAmount, protocolVersion, servedProtocolFeeBps }),
  }
}

/**
 * Create-pool fee tier options.
 * - Flag off: the pool-backed defaults unchanged.
 * - v2/v3 (flag on): the same tiers, each gaining a breakdown so every box shows the all-in rate with
 *   the LP/protocol split on hover — served when a pool exists, else the subtractive fee-switch schedule —
 *   and a `created` flag so a not-yet-created tier renders "Not created" (same as v4).
 * - v4 (flag on): the four canonical new tiers (0.0075 / 0.0375 / 0.25 / 0.90%), each with its effective
 *   rate (served when a pool already exists at that tier, else derived from the curve). A pairing shows
 *   its old tier instead only when that pool is deep (>= $5k), so we don't fragment existing liquidity.
 *   A hook's dynamic-fee pool is appended as its own box (it can be the most-used / pre-selected tier);
 *   its option is already built in `defaultFeeTiers` (getDefaultFeeTiersWithData, top-by-TVL).
 */
export function getCreateFeeTierOptions({
  isFeeDisplayEnabled,
  protocolVersion,
  defaultFeeTiers,
  feeTierData,
  hook,
  l2TickSpacingConfig,
}: {
  isFeeDisplayEnabled: boolean
  protocolVersion: ProtocolVersion
  defaultFeeTiers: FeeTierOption[]
  feeTierData: Record<string, FeeTierData>
  hook: string | undefined
  l2TickSpacingConfig: L2TickSpacingConfig
}): FeeTierOption[] {
  if (!isFeeDisplayEnabled) {
    return defaultFeeTiers
  }

  // v2/v3: no keep-vs-swap; attach the subtractive breakdown for the hover tooltip, and carry the pool's
  // `created` flag (as the v4 branch does) so a not-yet-created tier renders "Not created", not a blank slot.
  if (protocolVersion !== ProtocolVersion.V4) {
    return defaultFeeTiers.map((tier) => ({
      ...withSubtractiveFeeBreakdown(tier, protocolVersion),
      created: tier.created ?? poolAtFee(feeTierData, tier.value.feeAmount)?.created ?? false,
    }))
  }

  const canonicalTiers = DEFAULT_FEE_TIER_PAIRS.map((pair) => {
    const { feeData, pool } = resolveCanonicalTier({ pair, feeTierData, l2TickSpacingConfig })
    return {
      value: feeData,
      title: getFeeTierTitle(bpsToFeeAmount(pair.oldBps)),
      selectionPercent: pool?.percentage,
      tvl: pool?.tvl,
      boostedApr: pool?.boostedApr,
      protocolFee: pool?.protocolFee,
      // A not-yet-created new-default tier (no pool) renders "Not created" instead of a TVL line.
      created: pool?.created ?? false,
      feeBreakdown: v4Breakdown({ feeAmount: feeData.feeAmount, pool, hook }),
    }
  })

  // A hook's dynamic-fee pool isn't a canonical numeric tier, so it's dropped by the DEFAULT_FEE_TIER_PAIRS
  // map above — but it can be the most-used tier (the pre-selected fee / "Highest TVL" header), so append
  // its already-built option from defaultFeeTiers. Rendered only when a hook is present (allowDynamicFee).
  const dynamicTier = defaultFeeTiers.find((tier) => isDynamicFeeTier(tier.value))
  return dynamicTier ? [...canonicalTiers, dynamicTier] : canonicalTiers
}

/** A synthesized, not-yet-created FeeTierData row for a new canonical v4 tier (no pool, zero liquidity). */
function makeUncreatedFeeTierData({
  feeData,
  formatPercent,
  hook,
}: {
  feeData: FeeData
  formatPercent: (percent: string | number | undefined, maxDecimals?: PercentNumberDecimals) => string
  hook: string | undefined
}): FeeTierData {
  return {
    fee: feeData,
    formattedFee: formatPercent(feeData.feeAmount / BIPS_BASE, MAX_FEE_TIER_DECIMALS),
    totalLiquidityUsd: 0,
    percentage: new Percent(0, 100),
    tvl: '0',
    created: false,
    feeBreakdown: getCreateTierFeeBreakdown({
      feeAmount: feeData.feeAmount,
      protocolVersion: ProtocolVersion.V4,
      hook,
    }),
  }
}

/** Attach the served v4 fee breakdown to an existing-pool row so it exposes the LP fee + hover tooltip. */
function withServedFeeBreakdownData(data: FeeTierData): FeeTierData {
  if (data.feeBreakdown || isDynamicFeeTier(data.fee)) {
    return data
  }
  return {
    ...data,
    feeBreakdown: getFeeBreakdown({
      feeAmount: data.fee.feeAmount,
      protocolVersion: ProtocolVersion.V4,
      servedProtocolFeeBps: protocolFeeToBps(data.protocolFee),
    }),
  }
}

/**
 * The "Select fee tier" search list. Flag off: the tiers as-is. Flag on (v4 create only): the four new
 * default tiers first (their real pool if one exists, else synthesized so they stay selectable), then
 * every other tier that actually has liquidity — a pool with TVL, or a dynamic-fee tier. The seeded old
 * default tiers with no TVL are dropped (they're no longer canonical for v4). Unlike
 * {@link getCreateFeeTierOptions} (the curated inline grid), this doesn't swap a tier out for its pairing.
 */
export function getCreateFeeTierSearchData({
  useNewDefaultFeeTiers,
  feeTierData,
  formatPercent,
  hook,
  l2TickSpacingConfig,
}: {
  useNewDefaultFeeTiers: boolean
  feeTierData: Record<string, FeeTierData>
  formatPercent: (percent: string | number | undefined, maxDecimals?: PercentNumberDecimals) => string
  hook?: string
  l2TickSpacingConfig: L2TickSpacingConfig
}): FeeTierData[] {
  if (!useNewDefaultFeeTiers) {
    return Object.values(feeTierData)
  }

  const newDefaultFeeAmounts = new Set(DEFAULT_FEE_TIER_PAIRS.map((pair) => bpsToFeeAmount(pair.newBps)))

  // The four new default tiers always lead — shown from their real pool if one exists, else synthesized.
  const newDefaultTiers = DEFAULT_FEE_TIER_PAIRS.map((pair) => {
    const feeData = feeDataFromBps(pair.newBps, l2TickSpacingConfig)
    const pool = poolAtFee(feeTierData, feeData.feeAmount)
    return pool ? withServedFeeBreakdownData(pool) : makeUncreatedFeeTierData({ feeData, formatPercent, hook })
  })

  // Then any other tier with real liquidity (or a dynamic-fee tier). Empty old default tiers are dropped.
  const otherTiers = Object.values(feeTierData)
    .filter(
      (data) =>
        !newDefaultFeeAmounts.has(data.fee.feeAmount) &&
        (isDynamicFeeTier(data.fee) || (parseFloat(data.tvl) || 0) > 0),
    )
    .map(withServedFeeBreakdownData)

  return [...newDefaultTiers, ...otherTiers]
}
