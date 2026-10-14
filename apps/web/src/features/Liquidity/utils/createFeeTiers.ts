import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Percent } from '@uniswap/sdk-core'
import { getCreateTierFeeBreakdown } from 'uniswap/src/features/fees/feeCurve'
import { DEFAULT_FEE_TIER_PAIRS } from 'uniswap/src/features/fees/feeTiers'
import { bpsToFeeAmount, feeAmountToBps } from 'uniswap/src/features/fees/feeUnits'
import { getFeeBreakdown } from 'uniswap/src/features/fees/getFeeBreakdown'
import type { FeeBreakdown } from 'uniswap/src/features/fees/types'
import type { FeeData } from 'uniswap/src/features/positions/types'
import { PercentNumberDecimals } from 'utilities/src/format/types'
import { BIPS_BASE } from '~/constants/misc'
import {
  calculateTickSpacingFromFeeAmount,
  createdPoolsAtFeeAmount,
  type FeeTierOption,
  getFeeTierTitle,
  isDynamicFeeTier,
  MAX_FEE_TIER_DECIMALS,
} from '~/features/Liquidity/utils/feeTiers'
import { FeeTierData } from '~/types/liquidity'

// Post-cutover the canonical v4 tiers are the new lower ones; an existing tier earns a box only when its
// pool already holds at least this much liquidity (USD), so we keep users in that deep pool instead of
// fragmenting liquidity into a parallel new-tier pool. Spec: "Same-tier pool handling (v4 only)".
const KEEP_EXISTING_TIER_MIN_TVL = 5000

// The v4 grid is this many boxes wide. Existing pools worth joining claim slots first; the canonical new
// tiers only fill what's left over — so the width is one box per canonical pairing, and a fifth pairing
// added upstream widens the grid rather than being silently dropped off the end.
const V4_GRID_SIZE = DEFAULT_FEE_TIER_PAIRS.length

/** FeeData for a not-yet-created tier given its LP fee in bps (tick spacing derived from the fee). */
function feeDataFromBps(bps: number): FeeData {
  const feeAmount = bpsToFeeAmount(bps)
  return {
    isDynamic: false,
    feeAmount,
    tickSpacing: calculateTickSpacingFromFeeAmount(feeAmount),
  }
}

function tvlOf(pool: { tvl: string | undefined }): number {
  return parseFloat(pool.tvl ?? '') || 0
}

function isIncentivized(pool: { boostedApr?: number }): boolean {
  return (pool.boostedApr ?? 0) > 0
}

/** Ranks pools sharing a fee amount by which one a user would rather join: incentivized first, then deepest. */
function byWorthJoining(a: FeeTierData, b: FeeTierData): number {
  return Number(isIncentivized(b)) - Number(isIncentivized(a)) || tvlOf(b) - tvlOf(a)
}

/**
 * The existing non-dynamic pool at a fee tier, matched by fee amount. One fee amount can back several pools
 * (same LP fee, different tick spacings) — prefer an incentivized one, then the deepest, so the tier box
 * represents the pool worth joining rather than whichever the record happened to list first.
 */
function poolAtFee(feeTierData: Record<string, FeeTierData>, feeAmount: number): FeeTierData | undefined {
  return Object.values(feeTierData)
    .filter((data) => !isDynamicFeeTier(data.fee) && data.fee.feeAmount === feeAmount)
    .sort(byWorthJoining)[0]
}

/**
 * The already-deployed pool a custom fee-tier entry should join instead of creating beside: of the pools
 * {@link createdPoolsAtFeeAmount} finds at that fee, the one most worth joining.
 *
 * Unlike {@link poolAtFee} this only considers pools that exist — `feeTierData` also carries the canonical
 * defaults with `created: false`, and those are exactly what the create flow is for.
 */
export function getCreatedPoolAtFeeAmount({
  feeTierData,
  feeAmount,
}: {
  feeTierData: Record<string, FeeTierData>
  feeAmount: number
}): FeeTierData | undefined {
  const fee: FeeData = { isDynamic: false, feeAmount, tickSpacing: calculateTickSpacingFromFeeAmount(feeAmount) }
  return createdPoolsAtFeeAmount({ feeTierData, fee }).sort(byWorthJoining)[0]
}

/** A pool's served protocol fee (a raw fee amount) in bps, or undefined when the backend didn't serve one. */
function protocolFeeToBps(protocolFee: number | undefined): number | undefined {
  return protocolFee === undefined ? undefined : feeAmountToBps(protocolFee)
}

/**
 * v4 effective-rate breakdown for a create-flow tier: the pool's served protocol fee when a pool exists,
 * else the governance curve (exact for vanilla, unavailable for hooked). Undefined for a dynamic tier,
 * which has no fixed rate to break down — matching withServedFeeBreakdownData / withSubtractiveFeeBreakdown.
 */
function v4Breakdown({
  feeAmount,
  pool,
  hook,
}: {
  feeAmount: number
  pool: FeeTierData | undefined
  hook: string | undefined
}): FeeBreakdown | undefined {
  if (pool && isDynamicFeeTier(pool.fee)) {
    return undefined
  }
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
 * Existing pools that have earned a box of their own, deepest first — already deep enough that we'd
 * rather users joined them than fragment into a parallel canonical-tier pool, or incentivized (the
 * rewards are the reason to join, and dropping the pool hides its reward APR entirely).
 *
 * One per fee amount: several pools can share an LP fee across tick spacings, and `poolAtFee` picks the
 * one worth representing. Not limited to the canonical fee amounts — a pair's deepest pool often sits at
 * a fee no pairing covers (USDC/USDT's $9.25M pool is at 0.0007%), and hiding it strands that liquidity.
 */
function tiersWorthJoining(feeTierData: Record<string, FeeTierData>): FeeTierData[] {
  const feeAmounts = new Set(
    Object.values(feeTierData)
      .filter((data) => !isDynamicFeeTier(data.fee))
      .map((data) => data.fee.feeAmount),
  )
  return [...feeAmounts]
    .flatMap((feeAmount) => poolAtFee(feeTierData, feeAmount) ?? [])
    .filter((pool) => tvlOf(pool) >= KEEP_EXISTING_TIER_MIN_TVL || isIncentivized(pool))
    .sort((a, b) => tvlOf(b) - tvlOf(a))
}

/**
 * The canonical new tier for a pairing, backed by its pool when one already exists (so a shallow pool at
 * the new tier still shows its TVL rather than "Not created") and otherwise not-yet-created.
 */
function canonicalTier({ pair, feeTierData }: { pair: { newBps: number }; feeTierData: Record<string, FeeTierData> }): {
  feeData: FeeData
  pool: FeeTierData | undefined
} {
  const pool = poolAtFee(feeTierData, bpsToFeeAmount(pair.newBps))
  return { feeData: pool?.fee ?? feeDataFromBps(pair.newBps), pool }
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
 * The on-chain pool the URL deep-linked to — same tick spacing and fee value as `selectedFee` ("same value"
 * = both dynamic, or same fee amount). Only a `created` pool: `feeTierData` also seeds canonical defaults
 * (`created: false`), and pinning one would evict the value's real deep pool as a "Not created" row.
 */
function pinnedPoolFor(
  feeTierData: Record<string, FeeTierData>,
  selectedFee: FeeData | undefined,
): FeeTierData | undefined {
  if (!selectedFee) {
    return undefined
  }
  const pinnedIsDynamic = isDynamicFeeTier(selectedFee)
  return Object.values(feeTierData).find(
    (data) =>
      data.created &&
      data.fee.tickSpacing === selectedFee.tickSpacing &&
      isDynamicFeeTier(data.fee) === pinnedIsDynamic &&
      (pinnedIsDynamic || data.fee.feeAmount === selectedFee.feeAmount),
  )
}

/** A grid box for `feeData`, carrying the stats of the pool backing it (none for a not-yet-created tier). */
function toOption({
  feeData,
  pool,
  hook,
}: {
  feeData: FeeData
  pool: FeeTierData | undefined
  hook: string | undefined
}): FeeTierOption {
  return {
    value: feeData,
    title: getFeeTierTitle(feeData.feeAmount, feeData.isDynamic),
    selectionPercent: pool?.percentage,
    tvl: pool?.tvl,
    boostedApr: pool?.boostedApr,
    rewards: pool?.rewards,
    protocolFee: pool?.protocolFee,
    // A not-yet-created new-default tier (no pool) renders "Not created" instead of a TVL line.
    created: pool?.created ?? false,
    feeBreakdown: v4Breakdown({ feeAmount: feeData.feeAmount, pool, hook }),
  }
}

/**
 * Point the grid box for the deep-linked fee value at that exact tick spacing's pool rather than the
 * value's deepest. Only re-points an already-rendered box (never adds one), so the "one box per value,
 * deepest wins" shape is untouched with no pin. v4 only — v2/v3 fees map 1:1 to a tick spacing.
 */
function repointOptionsToPinnedTickSpacing({
  options,
  feeTierData,
  selectedFee,
  hook,
}: {
  options: FeeTierOption[]
  feeTierData: Record<string, FeeTierData>
  selectedFee: FeeData | undefined
  hook: string | undefined
}): FeeTierOption[] {
  const pinnedPool = pinnedPoolFor(feeTierData, selectedFee)
  if (!pinnedPool) {
    return options
  }
  const pinnedIsDynamic = isDynamicFeeTier(pinnedPool.fee)
  return options.map((option) => {
    // Every dynamic box reads as the same value (no numeric fee to pair on); static boxes match on amount.
    const sameValue = pinnedIsDynamic
      ? isDynamicFeeTier(option.value)
      : !isDynamicFeeTier(option.value) && option.value.feeAmount === pinnedPool.fee.feeAmount
    if (!sameValue || option.value.tickSpacing === pinnedPool.fee.tickSpacing) {
      return option
    }
    return toOption({ feeData: pinnedPool.fee, pool: pinnedPool, hook })
  })
}

/**
 * Create-pool fee tier options.
 * - v2/v3: the pool-backed defaults, each with a breakdown (served, else the subtractive schedule) and a
 *   `created` flag so a not-yet-created tier renders "Not created".
 * - v4: a {@link V4_GRID_SIZE}-box grid built from `feeTierData` — tiers worth joining (deep/incentivized)
 *   claim slots deepest-first, canonical new tiers backfill, and a hook's deployed dynamic pool is appended.
 *   `poolAtFee` and the worth-joining pick keep one pool per value; `selectedFee` re-points a box to a deep link.
 */
export function getCreateFeeTierOptions({
  protocolVersion,
  defaultFeeTiers,
  feeTierData,
  hook,
  selectedFee,
}: {
  protocolVersion: ProtocolVersion
  /** The v2/v3 pool-backed default tiers; the v4 grid doesn't read them. */
  defaultFeeTiers: FeeTierOption[]
  feeTierData: Record<string, FeeTierData>
  hook: string | undefined
  /**
   * The selected fee — the URL's on load, else the user's live pick. Re-points a box only when it names a
   * pool at a spacing the box isn't already showing; a no-op once a rendered box is selected.
   */
  selectedFee?: FeeData
}): FeeTierOption[] {
  // v2/v3: no keep-vs-swap; attach the subtractive breakdown for the hover tooltip, and carry the pool's
  // `created` flag (as the v4 branch does) so a not-yet-created tier renders "Not created", not a blank slot.
  if (protocolVersion !== ProtocolVersion.V4) {
    return defaultFeeTiers.map((tier) => ({
      ...withSubtractiveFeeBreakdown(tier, protocolVersion),
      created: tier.created ?? poolAtFee(feeTierData, tier.value.feeAmount)?.created ?? false,
    }))
  }

  const poolTiers = tiersWorthJoining(feeTierData).slice(0, V4_GRID_SIZE)
  const claimedFeeAmounts = new Set(poolTiers.map((pool) => pool.fee.feeAmount))

  // Canonical tiers only backfill the empty slots. A pairing is skipped once either side of it is already
  // on the grid: offering the new tier next to the deep old pool it pairs with is exactly the liquidity
  // fragmentation the pairing exists to prevent.
  const canonicalTiers = DEFAULT_FEE_TIER_PAIRS.filter(
    (pair) =>
      !claimedFeeAmounts.has(bpsToFeeAmount(pair.oldBps)) && !claimedFeeAmounts.has(bpsToFeeAmount(pair.newBps)),
  )
    .slice(0, V4_GRID_SIZE - poolTiers.length)
    .map((pair) => toOption({ ...canonicalTier({ pair, feeTierData }), hook }))

  const gridTiers = [...poolTiers.map((pool) => toOption({ feeData: pool.fee, pool, hook })), ...canonicalTiers]

  // A dynamic-fee pool has no numeric tier to rank or pair on, so it's kept off the grid above and appended
  // on its own — the one worth joining if several share the hook. Only a deployed pool: `feeTierData` also
  // seeds a not-yet-created dynamic default. Rendered only when a hook is present (allowDynamicFee).
  const dynamicPool = Object.values(feeTierData)
    .filter((data) => data.created && isDynamicFeeTier(data.fee))
    .sort(byWorthJoining)
    .at(0)
  const gridWithDynamic = dynamicPool
    ? [...gridTiers, toOption({ feeData: dynamicPool.fee, pool: dynamicPool, hook })]
    : gridTiers
  return repointOptionsToPinnedTickSpacing({ options: gridWithDynamic, feeTierData, selectedFee, hook })
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
 * Collapse rows a user reads as one fee (same `formattedFee`) but that differ by tick spacing down to the
 * one worth joining (incentivized, then deepest — {@link byWorthJoining}), so the list never shows two rows
 * for what reads as one fee — e.g. two dynamic-fee pools on one hook, both "Dynamic fee". The shallower
 * sibling is intentionally stranded. A deep-linked `selectedFee` wins over TVL, so that direct link still
 * resolves to — and can select — its pool; first-seen order is preserved and a pinned pool with no row of
 * its own is appended, not dropped. (`formattedFee` is the pool's own display string, so no new key is needed.)
 */
function collapseFeeTierDataByValue({
  tiers,
  feeTierData,
  selectedFee,
}: {
  tiers: FeeTierData[]
  feeTierData: Record<string, FeeTierData>
  selectedFee?: FeeData
}): FeeTierData[] {
  const pinnedPool = pinnedPoolFor(feeTierData, selectedFee)

  const groups = new Map<string, FeeTierData[]>()
  for (const tier of tiers) {
    groups.set(tier.formattedFee, [...(groups.get(tier.formattedFee) ?? []), tier])
  }

  const collapsed = [...groups].map(([formattedFee, group]) => {
    if (pinnedPool && formattedFee === pinnedPool.formattedFee) {
      // Prefer the pinned pool's own row; surface it directly if it was filtered out of `tiers` (e.g. 0 TVL).
      const pinnedRow = group.find((tier) => tier.fee.tickSpacing === pinnedPool.fee.tickSpacing)
      return pinnedRow ?? withServedFeeBreakdownData(pinnedPool)
    }
    return [...group].sort(byWorthJoining)[0]
  })

  // Deep-linked to a real pool whose fee value has no row at all: show it rather than dropping it.
  if (pinnedPool && !groups.has(pinnedPool.formattedFee)) {
    collapsed.push(withServedFeeBreakdownData(pinnedPool))
  }

  return collapsed
}

/**
 * The "Select fee tier" search list. `useNewDefaultFeeTiers` off: the tiers as-is. On (v4 create only):
 * the four new default tiers first (their real pool if one exists, else synthesized so they stay selectable), then
 * every other tier that actually has liquidity — a pool with TVL, or a dynamic-fee tier. The seeded old
 * default tiers with no TVL are dropped (they're no longer canonical for v4). Unlike
 * {@link getCreateFeeTierOptions} (the curated inline grid), this doesn't swap a tier out for its pairing.
 * Same-value tiers differing by tick spacing are then collapsed via {@link collapseFeeTierDataByValue}.
 */
export function getCreateFeeTierSearchData({
  useNewDefaultFeeTiers,
  feeTierData,
  formatPercent,
  hook,
  selectedFee,
}: {
  useNewDefaultFeeTiers: boolean
  feeTierData: Record<string, FeeTierData>
  formatPercent: (percent: string | number | undefined, maxDecimals?: PercentNumberDecimals) => string
  hook?: string
  /** The URL-backed selected fee; a pinned tick spacing is shown instead of its value's deepest pool. */
  selectedFee?: FeeData
}): FeeTierData[] {
  if (!useNewDefaultFeeTiers) {
    return Object.values(feeTierData)
  }

  const newDefaultFeeAmounts = new Set(DEFAULT_FEE_TIER_PAIRS.map((pair) => bpsToFeeAmount(pair.newBps)))

  // The four new default tiers always lead — shown from their real pool if one exists, else synthesized.
  const newDefaultTiers = DEFAULT_FEE_TIER_PAIRS.map((pair) => {
    const feeData = feeDataFromBps(pair.newBps)
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

  return collapseFeeTierDataByValue({ tiers: [...newDefaultTiers, ...otherTiers], feeTierData, selectedFee })
}
