import { type Currency, CurrencyAmount, type Percent } from '@uniswap/sdk-core'
import {
  DEFAULT_NEW_TOKEN_AUCTION_SUPPLY_PERCENT,
  MAX_POST_AUCTION_LIQUIDITY_PERCENT,
  MIN_POST_AUCTION_LIQUIDITY_PERCENT,
  type PostAuctionLiquidityAllocation,
  PostAuctionLiquidityAllocationType,
  type PostAuctionLiquidityTier,
} from '~/pages/Liquidity/CreateAuction/types'
import {
  clampPostAuctionLiquidityTierPercent,
  formatCompactNumberInput,
  getMaxTieredPostAuctionLiquidityEffectivePercent,
  getMinimumPostAuctionLiquidityTierMilestone,
  getPostAuctionLiquidityPreviewPercent,
  isUnboundedTier,
  parseCompactNumberInput,
  postAuctionLiquidityTokenAmountFromDepositedAndUiPercent,
} from '~/pages/Liquidity/CreateAuction/utils'

export function buildAuctionAmountsFromLiquidityPreview(
  totalSupply: CurrencyAmount<Currency>,
  {
    previewPercent,
    auctionSupplyPercent = DEFAULT_NEW_TOKEN_AUCTION_SUPPLY_PERCENT,
  }: { previewPercent: number; auctionSupplyPercent?: Percent },
): {
  totalSupply: CurrencyAmount<Currency>
  auctionSupplyAmount: CurrencyAmount<Currency>
  postAuctionLiquidityAmount: CurrencyAmount<Currency>
} {
  const auctionSupplyAmount = totalSupply.multiply(auctionSupplyPercent)
  return {
    totalSupply,
    auctionSupplyAmount,
    postAuctionLiquidityAmount: postAuctionLiquidityTokenAmountFromDepositedAndUiPercent(
      auctionSupplyAmount,
      previewPercent,
    ),
  }
}

export function updateCommittedPostAuctionLiquidity(
  committed:
    | {
        totalSupply: CurrencyAmount<Currency>
        auctionSupplyAmount: CurrencyAmount<Currency>
        postAuctionLiquidityAmount: CurrencyAmount<Currency>
      }
    | undefined,
  allocation: PostAuctionLiquidityAllocation,
) {
  if (!committed) {
    return committed
  }

  return {
    ...committed,
    postAuctionLiquidityAmount: getPostAuctionLiquidityAmountFromAllocation(committed.auctionSupplyAmount, allocation),
  }
}

function getZeroAmount(currency: Currency): CurrencyAmount<Currency> {
  return CurrencyAmount.fromRawAmount(currency, 0)
}

/**
 * Computes the maximum token reservation for a tiered (marginal) LP allocation.
 *
 * Each tier's LP percentage applies only to the marginal raise within that tier's range,
 * like tax brackets. The maximum reservation occurs at the tier boundary with the highest
 * effective LP rate.
 *
 * At each boundary M_i:
 *   lpAccum = Σ (p_j × (M_j − M_{j−1}))   for j = 1..i
 *   r_eff   = lpAccum / M_i
 *   R       = S × r_eff / (1 + r_eff)  =  S × lpAccum / (M_i + lpAccum)
 *
 * We evaluate at every boundary and return the maximum R.
 */
function resolveTieredPostAuctionLiquidity(
  auctionSupplyAmount: CurrencyAmount<Currency>,
  allocation: PostAuctionLiquidityAllocation,
): CurrencyAmount<Currency> | null {
  if (allocation.type !== PostAuctionLiquidityAllocationType.TIERED) {
    return null
  }

  const effectivePercent = getMaxTieredPostAuctionLiquidityEffectivePercent(allocation)
  if (effectivePercent <= 0) {
    return null
  }

  return postAuctionLiquidityTokenAmountFromDepositedAndUiPercent(auctionSupplyAmount, effectivePercent)
}

export function getPostAuctionLiquidityAmountFromAllocation(
  auctionSupplyAmount: CurrencyAmount<Currency>,
  allocation: PostAuctionLiquidityAllocation,
): CurrencyAmount<Currency> {
  if (allocation.type === PostAuctionLiquidityAllocationType.SINGLE) {
    return postAuctionLiquidityTokenAmountFromDepositedAndUiPercent(
      auctionSupplyAmount,
      getPostAuctionLiquidityPreviewPercent(allocation),
    )
  }

  return (
    resolveTieredPostAuctionLiquidity(auctionSupplyAmount, allocation) ?? getZeroAmount(auctionSupplyAmount.currency)
  )
}

/**
 * Smallest deposit whose split into sold (`S`) and LP reserve (`R = D·r/(1+r)`) leaves **both**
 * legs at ≥ 1 base unit after flooring. Below this, a leg rounds to 0 base units — a degenerate
 * auction that also divides by zero in the slider-percent math.
 *
 * `R ≥ 1` is the binding constraint (the smaller leg for `r ≤ 100%`):
 *   D·r/(1+r) ≥ 1  ⟺  D ≥ (1+r)/r = 1 + 1/r,  with `r = effectiveLpPercent/100`.
 * So a smaller LP percent needs a larger minimum (10% → 11 units, 25% → 5, 100% → 2).
 */
export function minimumAuctionSupplyDeposit(
  currency: Currency,
  allocation: PostAuctionLiquidityAllocation,
): CurrencyAmount<Currency> {
  const effectiveLpPercent =
    allocation.type === PostAuctionLiquidityAllocationType.SINGLE
      ? allocation.percent
      : getMaxTieredPostAuctionLiquidityEffectivePercent(allocation)

  // No LP reserve at all → only the sold leg must clear 1 base unit.
  if (effectiveLpPercent <= 0) {
    return CurrencyAmount.fromRawAmount(currency, 1)
  }

  const minRawUnits = 1 + Math.ceil(100 / effectiveLpPercent)
  return CurrencyAmount.fromRawAmount(currency, minRawUnits)
}

/**
 * Whether the current post-auction liquidity allocation can produce a positive reservation.
 * Tiered allocations must use the same per-tier LP percent bounds as single mode (minimum 25%)
 * and produce a positive marginal effective LP rate from milestones.
 */
export function isPostAuctionLiquidityAllocationValid(allocation: PostAuctionLiquidityAllocation): boolean {
  if (allocation.type === PostAuctionLiquidityAllocationType.SINGLE) {
    return allocation.percent >= MIN_POST_AUCTION_LIQUIDITY_PERCENT
  }
  if (
    !allocation.tiers.every(
      (tier) =>
        tier.percent >= MIN_POST_AUCTION_LIQUIDITY_PERCENT && tier.percent <= MAX_POST_AUCTION_LIQUIDITY_PERCENT,
    )
  ) {
    return false
  }
  return getMaxTieredPostAuctionLiquidityEffectivePercent(allocation) > 0
}

/**
 * Clamps percents and enforces strictly increasing **numeric** milestones between bounded tiers
 * (`previousMilestone` is the raw value from the last iteration, not the formatted string).
 *
 * Display strings are produced via `formatCompactNumberInput`. At compact boundaries
 * (e.g. 1_000_001 → `"1m"`), two tiers can normalize to the **same** formatted milestone even
 * when raw values differ; the later tier then contributes zero marginal raise to LP math with
 * no extra signal. Callers should not assume formatted labels are strictly ordered.
 */
export function normalizePostAuctionLiquidityAllocation(
  allocation: PostAuctionLiquidityAllocation,
): PostAuctionLiquidityAllocation {
  if (allocation.type !== PostAuctionLiquidityAllocationType.TIERED) {
    return allocation
  }

  let previousMilestone = 0
  let boundedTierCount = 0
  const normalizedTiers: PostAuctionLiquidityTier[] = []

  for (const tier of allocation.tiers) {
    if (isUnboundedTier(tier)) {
      normalizedTiers.push({
        ...tier,
        percent: clampPostAuctionLiquidityTierPercent(tier.percent),
      })
      continue
    }

    const isFirstBoundedTier = boundedTierCount === 0
    boundedTierCount += 1
    const minimumMilestone = getMinimumPostAuctionLiquidityTierMilestone(
      isFirstBoundedTier ? undefined : previousMilestone,
    )
    const parsedMilestone = parseCompactNumberInput(tier.raiseMilestone)
    const nextMilestone = Math.max(parsedMilestone ?? minimumMilestone, minimumMilestone)

    normalizedTiers.push({
      ...tier,
      raiseMilestone: formatCompactNumberInput(nextMilestone),
      percent: clampPostAuctionLiquidityTierPercent(tier.percent),
    })
    previousMilestone = nextMilestone
  }

  return {
    ...allocation,
    tiers: normalizedTiers,
  }
}
