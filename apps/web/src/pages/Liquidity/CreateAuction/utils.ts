import { type Currency, CurrencyAmount, Fraction, Percent } from '@uniswap/sdk-core'
import {
  DEFAULT_POST_AUCTION_LIQUIDITY_TIER_INITIAL_MILESTONE,
  MAX_POST_AUCTION_LIQUIDITY_PERCENT,
  MIN_POST_AUCTION_LIQUIDITY_PERCENT,
  type PostAuctionLiquidityAllocation,
  PostAuctionLiquidityAllocationType,
  type PostAuctionLiquidityTier,
  UNBOUNDED_TIER_ID,
} from '~/pages/Liquidity/CreateAuction/types'

const PERCENT_SCALE = 1_000_000
const COMPACT_NUMBER_SUFFIX_EXPONENTS: Record<'k' | 'm' | 'b' | 't', number> = {
  k: 3,
  m: 6,
  b: 9,
  t: 12,
}
const COMPACT_NUMBER_FORMATS = [
  { suffix: 't', value: 1_000_000_000_000 },
  { suffix: 'b', value: 1_000_000_000 },
  { suffix: 'm', value: 1_000_000 },
  { suffix: 'k', value: 1_000 },
] as const

function formatCompactNormalized(normalized: number): string {
  return Number.isInteger(normalized)
    ? normalized.toFixed(0)
    : normalized.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
}

export function clampPostAuctionLiquidityPercent(percent: number): number {
  return Math.min(Math.max(percent, MIN_POST_AUCTION_LIQUIDITY_PERCENT), MAX_POST_AUCTION_LIQUIDITY_PERCENT)
}

export function clampPostAuctionLiquidityTierPercent(percent: number): number {
  return Math.min(Math.max(percent, MIN_POST_AUCTION_LIQUIDITY_PERCENT), MAX_POST_AUCTION_LIQUIDITY_PERCENT)
}

/** Maximum fractional digits allowed while editing post-auction liquidity percent inputs. */
export const MAX_POST_AUCTION_PARTIAL_PERCENT_DECIMAL_PLACES = 5

/** Normalizes JS arithmetic for decimal text fields (avoids float artifacts like 0.30000000000000004). */
export function formatArithmeticResultForInput(n: number): string {
  if (!Number.isFinite(n)) {
    return ''
  }
  if (n === 0) {
    return '0'
  }
  const cleaned = Number.parseFloat(n.toPrecision(12))
  if (!Number.isFinite(cleaned)) {
    return ''
  }
  let s = cleaned.toString()
  if (s.includes('e') || s.includes('E')) {
    s = cleaned.toFixed(18).replace(/\.?0+$/, '') || '0'
  }
  return s === '-0' ? '0' : s
}

export function isValidPartialPercentInput(value: string): boolean {
  if (value === '') {
    return true
  }

  const dot = value.indexOf('.')
  if (dot === -1) {
    return /^\d+$/.test(value)
  }
  if (value.indexOf('.', dot + 1) !== -1) {
    return false
  }

  const intPart = value.slice(0, dot)
  const fracPart = value.slice(dot + 1)
  if (fracPart.length > MAX_POST_AUCTION_PARTIAL_PERCENT_DECIMAL_PLACES) {
    return false
  }
  if (intPart !== '' && !/^\d+$/.test(intPart)) {
    return false
  }
  if (!/^\d*$/.test(fracPart)) {
    return false
  }

  return intPart !== '' || fracPart !== '' || value === '.'
}

export function isValidPartialSignedPercentInput(value: string): boolean {
  if (value === '' || value === '-' || value === '+' || value === '.' || value === '-.' || value === '+.') {
    return true
  }

  const signless = value[0] === '-' || value[0] === '+' ? value.slice(1) : value
  return isValidPartialPercentInput(signless)
}

export function isUnboundedTier(tier: PostAuctionLiquidityTier): boolean {
  return !tier.raiseMilestone
}

export function createSinglePostAuctionLiquidityAllocation(percent: number): PostAuctionLiquidityAllocation {
  return {
    type: PostAuctionLiquidityAllocationType.SINGLE,
    percent: clampPostAuctionLiquidityPercent(percent),
  }
}

function formatCompactNumber(value: number): string {
  for (let i = 0; i < COMPACT_NUMBER_FORMATS.length; i++) {
    const { suffix, value: threshold } = COMPACT_NUMBER_FORMATS[i]
    if (Math.abs(value) < threshold) {
      continue
    }
    const normalized = value / threshold
    const formatted = formatCompactNormalized(normalized)
    // toFixed(2) can round e.g. 999.999 → "1000.00" → "1000k"; use the next suffix instead.
    if (Math.abs(parseFloat(formatted)) >= 1000 && i > 0) {
      const { suffix: upperSuffix, value: upperThreshold } = COMPACT_NUMBER_FORMATS[i - 1]
      const upperNormalized = value / upperThreshold
      return `${formatCompactNormalized(upperNormalized)}${upperSuffix}`
    }
    return `${formatted}${suffix}`
  }

  // Values below 1k: avoid raw `toString()` float noise (e.g. "285.7142857142857") that breaks
  // USD↔raise round-trips and tier previews; keep a stable decimal string instead.
  return formatArithmeticResultForInput(value)
}

export function formatCompactNumberInput(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return ''
  }
  return formatCompactNumber(value)
}

export function formatCompactNumberLabel(value: string): string {
  const parsed = parseCompactNumberInput(value)
  return parsed ? `${formatCompactNumber(parsed).toUpperCase()}+` : ''
}

export function formatCompactNumberDisplay(value: number): string {
  const formatted = formatCompactNumber(value)
  return formatted.replace(/k$/, 'K').replace(/m$/, 'M').replace(/b$/, 'B').replace(/t$/, 'T')
}

/** Ellipsizes a token symbol for compact display next to an amount (e.g. "SUPERLONGTOKEN" -> "SUPERLON…"). */
export function truncateSymbol(symbol: string, maxLength = 8): string {
  return symbol.length > maxLength ? `${symbol.slice(0, maxLength)}…` : symbol
}

export function expandCompactNumberInput(input: string): string | null {
  const trimmed = input.trim().toLowerCase()
  if (!trimmed) {
    return null
  }

  const lastChar = trimmed[trimmed.length - 1]
  const exponent =
    lastChar in COMPACT_NUMBER_SUFFIX_EXPONENTS
      ? COMPACT_NUMBER_SUFFIX_EXPONENTS[lastChar as keyof typeof COMPACT_NUMBER_SUFFIX_EXPONENTS]
      : undefined

  if (exponent === undefined) {
    return /^\d*\.?\d+$/.test(trimmed) ? trimmed : null
  }

  const numeric = trimmed.slice(0, -1)
  if (!numeric || !/^\d*\.?\d+$/.test(numeric)) {
    return null
  }

  const dot = numeric.indexOf('.')
  if (dot === -1) {
    return numeric + '0'.repeat(exponent)
  }

  const intPart = numeric.slice(0, dot)
  const fracPart = numeric.slice(dot + 1)
  if (fracPart.length <= exponent) {
    return intPart + fracPart + '0'.repeat(exponent - fracPart.length)
  }

  return `${intPart}${fracPart.slice(0, exponent)}.${fracPart.slice(exponent)}`
}

export function parseCompactNumberInput(input: string): number | null {
  const expanded = expandCompactNumberInput(input)
  if (!expanded) {
    return null
  }
  const parsed = Number(expanded)
  return Number.isFinite(parsed) ? parsed : null
}

export function isAllowedCompactNumberInput(value: string): boolean {
  return /^(\d*\.?\d*)[kmbt]?$/i.test(value)
}

/** True when `value` carries more fractional digits than `decimals` after compact-suffix expansion.
 * Below the token's smallest unit, `tryParseCurrencyAmount` rounds to zero wei and downstream percent
 * math (`amountToPercent`, LP derivation) can then divide by an unexpected zero. */
export function inputExceedsCurrencyPrecision(value: string, decimals: number): boolean {
  const expanded = expandCompactNumberInput(value) ?? ''
  const dotIdx = expanded.indexOf('.')
  return dotIdx !== -1 && expanded.length - dotIdx - 1 > decimals
}

export function getMinimumPostAuctionLiquidityTierMilestone(previousMilestone?: number): number {
  return previousMilestone && previousMilestone > 0 ? previousMilestone + 1 : 1
}

function createUnboundedTier(percent: number): PostAuctionLiquidityTier {
  return {
    id: UNBOUNDED_TIER_ID,
    raiseMilestone: '',
    percent: clampPostAuctionLiquidityTierPercent(percent),
  }
}

export function createTieredPostAuctionLiquidityAllocation(percent: number): PostAuctionLiquidityAllocation {
  return {
    type: PostAuctionLiquidityAllocationType.TIERED,
    tiers: [createUnboundedTier(percent)],
  }
}

function nextBoundedTierNumericId(tiers: PostAuctionLiquidityTier[]): number {
  const boundedTiers = tiers.filter((t) => !isUnboundedTier(t))
  let maxN = 0
  let anyNumericTierId = false
  for (const t of boundedTiers) {
    const parsed = Number(t.id.replace(/^tier-/, ''))
    if (Number.isFinite(parsed)) {
      maxN = Math.max(maxN, parsed)
      anyNumericTierId = true
    }
  }
  if (anyNumericTierId || boundedTiers.length === 0) {
    return maxN + 1
  }
  return boundedTiers.length + 1
}

/**
 * Creates a new bounded tier to insert before the unbounded tier.
 *
 * - First bounded tier defaults to `DEFAULT_POST_AUCTION_LIQUIDITY_TIER_INITIAL_MILESTONE` (raise units).
 *   When `usdPriceNum` is provided (USD input mode), this default is interpreted as USD instead and
 *   converted to raise units (`100k USD / usdPriceNum`) so the user sees a round $100k milestone.
 * - Subsequent tiers default to **10× the previous tier in USD** when `usdPriceNum` is set: the next
 *   boundary is `round(lastRaise × usdPrice × 10)` whole USD, then converted back to raise. That keeps
 *   defaults on exact USD rungs ($1m, $10m, …) without IEEE error from `10 ×` in raise space alone.
 *   In raise-only mode, defaults stay `10 ×` the last bounded milestone (compact-formatted).
 */
export function createNextBoundedTier(
  tiers: PostAuctionLiquidityTier[],
  options?: { usdPriceNum: number | null },
): PostAuctionLiquidityTier {
  const boundedTiers = tiers.filter((t) => !isUnboundedTier(t))
  const unboundedTier = tiers.find(isUnboundedTier)
  const defaultPercent = clampPostAuctionLiquidityTierPercent(unboundedTier?.percent ?? 0)
  const nextId = nextBoundedTierNumericId(tiers)

  if (boundedTiers.length === 0) {
    const usdPriceNum = options?.usdPriceNum
    const initialRaiseMilestone =
      usdPriceNum && usdPriceNum > 0
        ? formatArithmeticResultForInput(DEFAULT_POST_AUCTION_LIQUIDITY_TIER_INITIAL_MILESTONE / usdPriceNum)
        : formatCompactNumberInput(DEFAULT_POST_AUCTION_LIQUIDITY_TIER_INITIAL_MILESTONE)
    return {
      id: `tier-${nextId}`,
      raiseMilestone: initialRaiseMilestone,
      percent: defaultPercent,
    }
  }

  const lastBounded = boundedTiers[boundedTiers.length - 1]
  const lastMilestone = parseCompactNumberInput(lastBounded.raiseMilestone)
  const usdPriceNum = options?.usdPriceNum

  if (usdPriceNum && usdPriceNum > 0 && lastMilestone && lastMilestone > 0) {
    const nextUsdMilestone = Math.round(lastMilestone * usdPriceNum * 10)
    const nextRaise = nextUsdMilestone / usdPriceNum
    return {
      id: `tier-${nextId}`,
      raiseMilestone: formatArithmeticResultForInput(nextRaise),
      percent: defaultPercent,
    }
  }

  const nextMilestone =
    lastMilestone && lastMilestone > 0 ? lastMilestone * 10 : DEFAULT_POST_AUCTION_LIQUIDITY_TIER_INITIAL_MILESTONE

  return {
    id: `tier-${nextId}`,
    raiseMilestone: formatCompactNumberInput(nextMilestone),
    percent: defaultPercent,
  }
}

/**
 * Computes the LP dollar contribution for a single tier using the marginal (tax-bracket) model.
 * Only the raise within the tier's range [previousMilestone, milestone] is multiplied by the tier's percent.
 */
export function getPostAuctionLiquidityTierLpDollars(
  tier: Pick<PostAuctionLiquidityTier, 'raiseMilestone' | 'percent'>,
  previousMilestone?: number,
): number {
  const milestone = parseCompactNumberInput(tier.raiseMilestone)
  if (!milestone || tier.percent <= 0) {
    return 0
  }

  const range = milestone - (previousMilestone ?? 0)
  if (range <= 0) {
    return 0
  }

  return (range * clampPostAuctionLiquidityTierPercent(tier.percent)) / 100
}

/**
 * Computes the effective LP percent at the tier boundary that requires the maximum token reservation.
 *
 * At each tier boundary M_i, the effective rate is r_eff = lpAccum / M_i, where lpAccum is the
 * cumulative LP dollars up to that boundary. The reservation is S × r_eff / (1 + r_eff).
 * Since S is constant, the maximum reservation occurs at the boundary with the highest
 * r_eff / (1 + r_eff), which is the boundary with the highest r_eff.
 *
 * Returns r_eff × 100 (UI percent scale) so it can be passed directly to
 * `postAuctionLiquidityTokenAmountFromDepositedAndUiPercent`.
 */
export function getMaxTieredPostAuctionLiquidityEffectivePercent(allocation: PostAuctionLiquidityAllocation): number {
  if (allocation.type !== PostAuctionLiquidityAllocationType.TIERED) {
    return 0
  }

  let lpDollarsAccum = 0
  let maxEffectivePercent = 0
  let previousMilestone = 0

  for (const tier of allocation.tiers) {
    const tierPercent = clampPostAuctionLiquidityTierPercent(tier.percent)

    // Unbounded tier: r_eff converges to the tier's own percent as raise → ∞
    if (isUnboundedTier(tier)) {
      if (tierPercent > 0) {
        maxEffectivePercent = Math.max(maxEffectivePercent, tierPercent)
      }
      continue
    }

    const tierMilestone = parseCompactNumberInput(tier.raiseMilestone)
    if (!tierMilestone || tierPercent <= 0) {
      previousMilestone = tierMilestone ?? previousMilestone
      continue
    }

    const tierRange = tierMilestone - previousMilestone
    if (tierRange <= 0) {
      previousMilestone = tierMilestone
      continue
    }

    lpDollarsAccum += (tierPercent / 100) * tierRange
    const effectivePercent = (lpDollarsAccum / tierMilestone) * 100
    maxEffectivePercent = Math.max(maxEffectivePercent, effectivePercent)
    previousMilestone = tierMilestone
  }

  return maxEffectivePercent
}

export function getPostAuctionLiquidityPreviewPercent(allocation: PostAuctionLiquidityAllocation): number {
  if (allocation.type === PostAuctionLiquidityAllocationType.SINGLE) {
    return clampPostAuctionLiquidityPercent(allocation.percent)
  }

  const effectivePercent = getMaxTieredPostAuctionLiquidityEffectivePercent(allocation)
  if (effectivePercent <= 0) {
    return 0
  }
  return clampPostAuctionLiquidityPercent(effectivePercent)
}

// Raise-currency resolution lives in its own module; re-exported here so callers keep one import
// path for CreateAuction utilities.
export {
  getPrimaryStablecoin,
  getRaiseCurrencyAddress,
  getRaiseCurrencyAsCurrency,
} from '~/pages/Liquidity/CreateAuction/raiseCurrency'

/**
 * Converts a float percentage into a SDK Percent (exact rational).
 * Supports up to 6 decimal places in the percentage value.
 */
function toPercent(value: number): Percent {
  return new Percent(Math.round(value * PERCENT_SCALE), 100 * PERCENT_SCALE)
}

/**
 * Applies a float percentage to a CurrencyAmount and returns the exact result.
 */
export function percentOfAmount(amount: CurrencyAmount<Currency>, percent: number): CurrencyAmount<Currency> {
  return amount.multiply(toPercent(percent))
}

/**
 * Derives the float percentage that `part` represents of `total` (same currency/decimals).
 * Divides on the exact fractions, not the floored `quotient` integers: a sub-base-unit `total`
 * (e.g. half a base unit from an LP split) floors to a `0` quotient and would divide by zero.
 * The exact fraction is non-zero whenever `total` is (already guarded), so this is crash-safe.
 */
export function amountToPercent(total: CurrencyAmount<Currency>, part: CurrencyAmount<Currency>): number {
  if (total.equalTo(0)) {
    return 0
  }
  const ratio = part.asFraction.divide(total.asFraction).multiply(100)
  return parseFloat(ratio.toFixed(6))
}

/**
 * Deposited auction tokens `D` split into sold `S` and LP reserve `R` with `R = r·S` and `D = S(1+r)`.
 * Post-auction LP uses `r·S` tokens from the sold pile (paired with raise currency) and `R` reserved tokens;
 * each token leg equals `r·S = R = D × r/(1+r)`.
 */
export function postAuctionLiquidityTokenAmountFromDeposit(
  deposited: CurrencyAmount<Currency>,
  fractionOfSoldToLiquidity: Percent,
): CurrencyAmount<Currency> {
  if (deposited.equalTo(0)) {
    return deposited
  }
  const one = new Fraction(1, 1)
  const r = new Fraction(fractionOfSoldToLiquidity.numerator, fractionOfSoldToLiquidity.denominator)
  return deposited.multiply(r.divide(one.add(r)))
}

/** Same as {@link postAuctionLiquidityTokenAmountFromDeposit} with UI percent 0–100 for `r`. */
export function postAuctionLiquidityTokenAmountFromDepositedAndUiPercent(
  deposited: CurrencyAmount<Currency>,
  percentOfSoldToLiquidity: number,
): CurrencyAmount<Currency> {
  if (deposited.equalTo(0) || percentOfSoldToLiquidity <= 0) {
    return CurrencyAmount.fromRawAmount(deposited.currency, 0)
  }
  return postAuctionLiquidityTokenAmountFromDeposit(deposited, toPercent(percentOfSoldToLiquidity))
}

/** Slider value: fraction of *sold* tokens that seed LP (`r`), derived from deposit and LP token leg amount. */
export function percentOfSoldToLiquidityFromDepositAndLiquidityAmount(
  deposited: CurrencyAmount<Currency>,
  postAuctionLiquidityAmount: CurrencyAmount<Currency>,
): number {
  if (deposited.equalTo(0)) {
    return 0
  }
  const sold = deposited.subtract(postAuctionLiquidityAmount)
  if (sold.equalTo(0)) {
    return 0
  }
  return amountToPercent(sold, postAuctionLiquidityAmount)
}

export {
  addCustomPriceRangePreset,
  clampCustomPriceRangeLiquidityPercent,
  createDefaultCustomPriceRangeEntry,
  getCustomPriceRangeLiquidityTotal,
  isCustomPriceRangeAllocationValid,
  isCustomPriceRangeEntryValid,
  removeCustomPriceRangeEntry,
  updateCustomPriceRangeBounds,
  updateCustomPriceRangeLiquidityPercent,
} from '~/pages/Liquidity/CreateAuction/customPriceRanges'
