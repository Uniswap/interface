/* oxlint-disable max-lines -- this file is the single home for the margin wire readers and the display
   formatters that share their conventions: usablePriceX18 / usableWireAmount / usableWireBalance and the
   direction-aware mark maths that decode against them. Each carries a docstring stating which sentinel it
   refuses and why, and those docstrings are the point — splitting the file to satisfy a line count would
   scatter one decoding contract across several, which is the exact failure mode ("a rule with three homes
   is a rule that gets applied to two of them") several of these guards were written to close. */
import type { MarginQuoteResponse } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import type { MarginDirection, MarginVenue } from 'uniswap/src/features/transactions/margin/types'
import { formatUnits } from '~/chains'
import type { MarginTokenInfo } from '~/constants/margin'
import { marginPairLegs, marginUnwrapSymbol } from '~/pages/Swap/Margin/marginTokenDisplay'

// Brand names for lending venues — not translated. Exhaustive record so adding a venue forces an entry.
const MARGIN_VENUE_LABELS: Record<MarginVenue, string> = {
  MORPHO: 'Morpho',
  AAVE_V3: 'Aave v3',
  AAVE_V4: 'Aave v4',
  COMPOUND_V3: 'Compound v3',
}

// A wire venue the union doesn't know yet, made readable: SCREAMING_SNAKE → brand-style title case with
// version segments lowercased ('SOME_NEW_VENUE' → 'Some New Venue', 'COMPOUND_V3' → 'Compound v3').
// Reproduces every MARGIN_VENUE_LABELS entry exactly, so the fallback reads like a curated one.
function prettifyMarginVenue(venue: string): string {
  return venue
    .split('_')
    .map((segment) =>
      /^V\d+$/.test(segment) ? segment.toLowerCase() : segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase(),
    )
    .join(' ')
}

// Takes the RAW wire venue, not MarginVenue: the backend can route to a venue this build predates, and
// an unmapped one would otherwise render the `{{venue}}` interpolation empty ("Open position on ").
export function marginVenueLabel(venue: string): string {
  return (MARGIN_VENUE_LABELS as Record<string, string | undefined>)[venue] ?? prettifyMarginVenue(venue)
}

// Convert a 1e18-scaled fixed-point value (WAD / X18) to a JS number for display.
export function scaledE18ToNumber(value: string): number {
  return Number(formatUnits(BigInt(value), 18))
}

/**
 * A price is usable only if it is a POSITIVE figure. The wire carries `"0"` for a read that failed, and
 * `"0"` is a truthy STRING — every `price ? … : fallback` reads it as present and then renders or
 * divides by zero. Normalising here keeps that trap in one place.
 *
 * Lives beside the other wire readers rather than next to any one consumer: the open flow, the adjust
 * modals and the positions surfaces all decode the same sentinel, and a rule with three homes is a rule
 * that gets applied to two of them.
 */
export function usablePriceX18(priceX18: string | undefined): string | undefined {
  if (!priceX18) {
    return undefined
  }
  try {
    return BigInt(priceX18) > 0n ? priceX18 : undefined
  } catch {
    return undefined
  }
}

// A wire BALANCE as a display number, or undefined when the value isn't one. Distinct from
// usableWireAmount below, and the distinction is the whole point: a balance is SIGNED and may legitimately
// be zero or negative — a debt-free short holds 0 debt, a fully reduced long holds 0 collateral, and an
// underwater position has negative equity — whereas for a price or an amount-to-render, 0 means absent.
// Both refuse the same garbage ('' → BigInt 0n rather than a throw, '1.5'/'1e18' → SyntaxError); only
// their treatment of a real zero and a real negative differs. Reading a balance through the wrong one
// suppresses valid positions, which is how an underwater row would lose its whole PnL block.
export function usableWireBalance({ raw, decimals }: { raw: string; decimals: number }): number | undefined {
  if (!raw) {
    return undefined
  }
  try {
    return Number(formatUnits(BigInt(raw), decimals))
  } catch {
    return undefined
  }
}

// A wire token amount as a display number, or undefined when it isn't one. BigInt throws a SyntaxError
// on any non-integer string ('1.5', '1e18'), which would take a whole block down mid-render rather than
// hide one row; and BigInt('') is 0n rather than a throw, so the zero sentinel arrives here looking
// like a real figure. Non-positive is absent, same rule as usablePriceX18 above.
export function usableWireAmount({ raw, decimals }: { raw: string; decimals: number }): number | undefined {
  try {
    const scaled = Number(formatUnits(BigInt(raw), decimals))
    return scaled > 0 ? scaled : undefined
  } catch {
    return undefined
  }
}

/**
 * The collateral figure behind a cross-token "2,000 USDC ≈ 0.98 ETH" caption, or undefined when the
 * line must not render at all.
 *
 * One owner for a rule with three consumers — the open form and the add/adjust sheets — because each
 * of them wrote it separately and each got a different subset right. Three ways it must withhold:
 *  - the payment token IS the collateral, so there is no conversion to state;
 *  - the quote is stale, because the caption's other half is the LIVE input: through the debounce or a
 *    placeholder refetch the sentence otherwise pairs a freshly typed 2,000 with the equity quoted for
 *    1,000, which was never a real conversion;
 *  - the leg carries no usable figure. `'0'` is a truthy string, so a `!== undefined` or a plain
 *    truthiness test both admit the sentinel and render "≈ 0" as though the quote had answered.
 */
export function conversionCaptionEquity({
  equityInRaw,
  decimals,
  isPaymentTokenCollateral,
  isQuoteStale,
}: {
  equityInRaw: string | undefined
  decimals: number
  isPaymentTokenCollateral: boolean
  isQuoteStale: boolean
}): number | undefined {
  if (isPaymentTokenCollateral || isQuoteStale || equityInRaw === undefined) {
    return undefined
  }
  return usableWireAmount({ raw: equityInRaw, decimals })
}

// Freshness of a poll: two missed intervals ⇒ stale. updatedAt 0 (never fetched) is treated fresh so
// nothing suppresses or dims before the first successful load. Lives here rather than beside any one
// consumer — the chart, the open form and the review sheet all price off the same markets poll, and a
// rule with three homes is a rule that gets applied to two of them.
export function isMarkStale({
  updatedAt,
  now,
  refetchMs,
}: {
  updatedAt: number
  now: number
  refetchMs: number
}): boolean {
  return updatedAt > 0 && now - updatedAt > 2 * refetchMs
}

// Display-precision only: a raw token amount as a JS number.
export function rawToNumber({ raw, decimals }: { raw: string; decimals: number }): number {
  return Number(raw) / 10 ** decimals
}

// Basis points arrive from the API as decimal strings; accept both and coerce.
export function bpsToPercent(bps: string | number): number {
  return Number(bps) / 100
}

// Liquidation LTV (WAD string) as a whole percent, e.g. "860000000000000000" -> 86.
export function lltvToPercent(lltvWad: string): number {
  return scaledE18ToNumber(lltvWad) * 100
}

// undefined = the wire has not authored a cap for this row yet; there is nothing to derive one from.
export function formatMaxLeverage(leverage: number | undefined): string {
  return leverage === undefined ? '—' : `${Math.round(leverage)}x`
}

// One-decimal leverage (trailing .0 trimmed): "2.5x", "3x". For real, possibly-fractional leverage —
// unlike formatMaxLeverage's whole-number headline estimate. Non-finite is reachable (a position at or
// past LLTV has no finite leverage) and must not render as "Infinityx".
export function formatLeverage(leverage: number): string {
  return Number.isFinite(leverage) ? `${Math.round(leverage * 10) / 10}x` : '∞'
}

// Two-decimal leverage for the modals and the pair heading, where the extra digit is often the whole
// difference between before and after.
export function formatLeverageX(value: number): string {
  return Number.isFinite(value) ? `${value.toFixed(2)}x` : '∞'
}

// The adjust quote reports MAX_UINT256 for leverage when equity is at or below zero. It scales to
// ~1.16e59 — finite, so formatLeverageX's guard would miss it and print sixty digits.
const MAX_UINT256 = (1n << 256n) - 1n

// NaN where the wire value is not a parseable X18 integer — the guarded shape every other reader in
// this file takes. A bare BigInt throws a SyntaxError on '2.5e18' or '1.5', out of the CALLER's render;
// NaN keeps that a hidden figure instead, and the leverage formatters already read it as unknown.
export function leverageX18ToNumber(x18: string): number {
  // The blank check is not redundant with the catch: `BigInt('')` is `0n`, not a throw, so an absent
  // leverage would read as a real 0x rather than as unknown.
  if (typeof x18 !== 'string' || x18.trim() === '') {
    return Number.NaN
  }
  try {
    return BigInt(x18) >= MAX_UINT256 ? Number.POSITIVE_INFINITY : scaledE18ToNumber(x18)
  } catch {
    return Number.NaN
  }
}

// Representative borrow APY for display. Falls back to an em dash when unknown. Accepts the wire's
// decimal-string bps (positions) as well as numeric bps (market selector).
export function formatBorrowRate(bps: number | string | undefined): string {
  return bps === undefined ? '—' : `${bpsToPercent(bps).toFixed(1)}%`
}

// Raw debt units as a compact "<amount> <symbol>" — borrowable liquidity runs to seven figures, which
// is unreadable in full, and its fractional part means nothing at that size.
export function formatMarginDebtUnits({
  raw,
  decimals,
  symbol,
  locale,
}: {
  raw: string
  decimals: number
  symbol: string
  // The app's locale, not the browser's: this figure renders beside app-formatted numbers, so
  // grouping has to come from the same source they use.
  locale: string
}): string {
  const value = Number(raw) / 10 ** decimals
  const compact =
    value >= 1_000_000
      ? `${(value / 1_000_000).toFixed(1)}M`
      : value.toLocaleString(locale, { maximumFractionDigits: 0 })
  return `${compact} ${symbol}`
}

export type MarginHealthKey = 'healthy' | 'caution' | 'atRisk'

// Health-factor tier boundaries. Liquidation is at HF = 1; these are the display bands above it.
export const HEALTHY_MIN_HF = 1.25
export const CAUTION_MIN_HF = 1.1

// Map a health factor to a status label key + theme colors. Infinity (debt-free) falls into healthy;
// NaN falls through both comparisons to atRisk — the safe default.
export function getMarginHealthStatus(healthFactor: number): {
  key: MarginHealthKey
  color: string
  backgroundColor: string
} {
  if (healthFactor >= HEALTHY_MIN_HF) {
    return { key: 'healthy', color: '$statusSuccess', backgroundColor: '$statusSuccess2' }
  }
  if (healthFactor >= CAUTION_MIN_HF) {
    return { key: 'caution', color: '$statusWarning', backgroundColor: '$statusWarning2' }
  }
  return { key: 'atRisk', color: '$statusCritical', backgroundColor: '$statusCritical2' }
}

// Health factor implied by a target EXPOSURE leverage, from the market's LLTV alone — a closed form,
// so the leverage slider recolors on the drag frame instead of waiting for a quote. A long at exposure
// L carries LTV (L−1)/L; a short's balance sheet is one turn higher, so it carries L/(L+1). An
// estimate: it ignores accrued interest and assumes the position lands exactly on the target, so it
// may only drive a control's color, never a stated figure. Aave rows publish no LLTV ('0'), which is
// undefined here rather than Infinity: no constraint to derive is not the same claim as no debt, and
// collapsing the two would paint an unconstrained market healthy at every leverage.
export function marginHealthFromLeverage({
  leverage,
  lltvWad,
  direction,
}: {
  leverage: number
  lltvWad: string
  direction: MarginDirection | undefined
}): number | undefined {
  // Through the guarded reader like every sibling here: `scaledE18ToNumber` calls BigInt unguarded, so
  // a wire value shaped '0.86' or '8.6e17' throws a SyntaxError — and this runs on the slider's render
  // path via marginLeverageTrackColor. usablePriceX18 also refuses the non-positive case this tested.
  const usableLltv = usablePriceX18(lltvWad)
  if (usableLltv === undefined) {
    return undefined
  }
  const lltv = scaledE18ToNumber(usableLltv)
  // NaN ONLY — never `!Number.isFinite`, which would also swallow +Infinity. The two are opposite
  // claims: NaN is unknown health (neutral track, as an unknown LLTV is), while +Infinity means "at or
  // past liquidation" and must fall through to the math below, which reads at-risk.
  //
  // What this exit still changes, now that each debt-free arm is pinned to its own input: a NaN leverage
  // on a SHORT would otherwise reach the balance-sheet math and read AT-RISK rather than neutral. (A
  // LONG no longer needs it — NaN fails `=== 1` and lands on undefined either way — so the earlier
  // "LONG paints green" rationale is spent. The guard is not: deleting it still moves the SHORT.)
  if (Number.isNaN(leverage)) {
    return undefined
  }
  // 0x is a real DEBT-FREE state only for a SHORT. A LONG's debt-free floor is 1x — the `> 1` test below
  // already encodes it — so a non-positive leverage on a LONG is not a position state at all, most
  // likely the wire's '0' absent sentinel (the one marginOpenedLeverage guards for its siblings).
  // Returning +Infinity there would paint the track GREEN at every leverage: the fail-open direction on
  // a health readout, and the same one the NaN exit above exists to prevent. Unknown, like NaN.
  // Each debt-free arm is pinned to the ONE input it describes, so anything that is not a real position
  // state (a SHORT below 0, a LONG under 1) takes the unknown path rather than the reassuring one.
  if (direction === 'SHORT' && leverage === 0) {
    return Number.POSITIVE_INFINITY
  }
  if (leverage <= 0) {
    return undefined
  }
  if (direction === 'SHORT') {
    return (lltv * (leverage + 1)) / leverage
  }
  if (leverage === 1) {
    // A LONG at exactly 1x is genuinely debt-free.
    return Number.POSITIVE_INFINITY
  }
  return leverage > 1 ? (lltv * leverage) / (leverage - 1) : undefined
}

// The leverage slider's track color, on the same tier scale the Health row reports.
export function marginLeverageTrackColor(input: {
  leverage: number
  lltvWad: string
  direction: MarginDirection | undefined
}): string {
  const healthFactor = marginHealthFromLeverage(input)
  // An unknown LLTV gets the neutral track, never the healthy one — a risk indicator must not read
  // reassuring on missing data.
  return healthFactor === undefined ? '$neutral3' : getMarginHealthStatus(healthFactor).color
}

export type MarginHealthTier = { key: MarginHealthKey; color: string }

export type MarginHealthDisplay =
  | { mode: 'single'; tier: MarginHealthTier }
  | { mode: 'transition'; before: MarginHealthTier; after: MarginHealthTier }

// Infinity (debt-free) resolves to the top tier; NaN (a broken upstream computation) falls through to
// atRisk. getMarginHealthStatus handles both directly — no coercion, so a bug can't paint green.
function healthTier(healthFactor: number): MarginHealthTier {
  const status = getMarginHealthStatus(healthFactor)
  return { key: status.key, color: status.color }
}

// How a health factor renders as a label: a single tier, or a before→after transition that COLLAPSES to
// a single tier when the action leaves the tier unchanged (a 1.30 → 1.26 move both read "Healthy").
export function resolveMarginHealthDisplay({ before, after }: { before: number; after?: number }): MarginHealthDisplay {
  const beforeTier = healthTier(before)
  if (after === undefined) {
    return { mode: 'single', tier: beforeTier }
  }
  const afterTier = healthTier(after)
  if (afterTier.key === beforeTier.key) {
    return { mode: 'single', tier: afterTier }
  }
  return { mode: 'transition', before: beforeTier, after: afterTier }
}

// Which liquidation badge (if any) a margin row shows. A liquidated position that has CLOSED was
// wound down entirely → "full"; one still OPEN kept residual collateral → "partial". A row that was
// partially liquidated but closed by the user also shows "partial". undefined = no badge.
export function getMarginLiquidationBadge(input: {
  liquidated: boolean | undefined
  partiallyLiquidated?: boolean
  status: 'open' | 'closed'
}): 'full' | 'partial' | undefined {
  if (input.liquidated === true) {
    return input.status === 'closed' ? 'full' : 'partial'
  }
  return input.partiallyLiquidated === true ? 'partial' : undefined
}

// Signed % move from the mark to the liquidation price — the single liquidation-distance definition.
// Geometry carries the direction, so no direction argument: a long liquidates on a fall (liq below
// mark, negative), a short on a rise (liq above, positive). Both prices are the volatile leg's USD
// price, so the ratio is unit-free. undefined when either price is unusable — never 0, which would
// render as a confident "0.0%".
//
// The only definition: the wire used to carry (1 − ltv/maxLtv), which is the required move for a long
// only — a short's is (1−k)/k, 29.0% against 22.5% at 3x, λ=0.86.
export function liqDistanceSignedPct({ liqPrice, mark }: { liqPrice: number; mark: number }): number | undefined {
  if (mark <= 0 || liqPrice <= 0) {
    return undefined
  }
  return ((liqPrice - mark) / mark) * 100
}

// Liquidation distance for a quote: its projected liq price against the venue's ORACLE mark, which is
// what liquidation actually triggers off. Callers must NOT pass the quote's own effectivePrice — an
// open's fill is adverse to the mark, so anchoring on it overstates the buffer by roughly the price
// impact, worst exactly when the impact is worth disclosing. The oracle mark is also what the
// positions table measures against, so the figure does not jump the moment a position opens.
export function quoteLiqDistanceSignedPct(quote: {
  liquidationPriceX18?: string
  markPriceX18?: string
}): number | undefined {
  // Through usablePriceX18, which this module documents as the single owner of "parseable and
  // positive". A bare truthiness test admits the '0' sentinel and lets a non-integer wire value throw a
  // SyntaxError out of BigInt mid-render — hiding one row is the intended failure, not losing the block.
  const liqPriceX18 = usablePriceX18(quote.liquidationPriceX18)
  const markPriceX18 = usablePriceX18(quote.markPriceX18)
  if (liqPriceX18 === undefined || markPriceX18 === undefined) {
    return undefined
  }
  return liqDistanceSignedPct({
    liqPrice: scaledE18ToNumber(liqPriceX18),
    mark: scaledE18ToNumber(markPriceX18),
  })
}

// Parenthesised suffix for a liquidation distance, e.g. "(−22.5%)". U+2212 minus.
export function formatLiqDistanceSuffix(pct: number): string {
  return `(${pct >= 0 ? '+' : '−'}${Math.abs(pct).toFixed(1)}%)`
}

// Long/Short badge styling — shared by the positions table and the drawer header.
export function getMarginDirectionStyle(direction: MarginDirection | undefined): {
  color: string
  backgroundColor: string
} {
  const isShort = direction === 'SHORT'
  return {
    color: isShort ? '$statusCritical' : '$statusSuccess',
    backgroundColor: isShort ? '$statusCritical2' : '$statusSuccess2',
  }
}

// markPriceX18 always reports the volatile asset's USD price (the backend pre-inverts it for SHORT
// positions/quotes). LONG: collateral IS the volatile asset — multiply by mark for its USD value.
// SHORT: collateral is the USD-stable leg (~1:1) — its USD value is just the raw amount.
export function collateralUsdValue({
  collateralAmount,
  mark,
  direction,
}: {
  collateralAmount: number
  mark: number
  direction: MarginDirection | undefined
}): number {
  return direction === 'SHORT' ? collateralAmount : collateralAmount * mark
}

// USD value of an EXPOSURE amount (a position's `size`). The exposure is always the volatile leg — a
// short's debt, a long's collateral — and `mark` is counter-per-exposure against a ~$1 stable counter,
// so it is amount × mark for BOTH directions. Distinct from collateralUsdValue, whose short case is the
// stable collateral leg (no mark): passing `size` to that one drops the mark and under-reports a short.
export function exposureUsdValue({ exposureAmount, mark }: { exposureAmount: number; mark: number }): number {
  return exposureAmount * mark
}

// Debt expressed in collateral units (see collateralUsdValue for the mark convention). LONG: debt is
// the USD-stable leg — divide by mark. SHORT: debt IS the volatile leg — multiply by mark instead.
export function debtInCollateralUnits({
  debtAmount,
  mark,
  direction,
}: {
  debtAmount: number
  mark: number
  direction: MarginDirection | undefined
}): number {
  return direction === 'SHORT' ? debtAmount * mark : debtAmount / mark
}

// The collateral a position holds, in collateral (human) units — the balance-sheet denominator for its
// displayed leverage and the close-revert guard. A long holds its collateral AS its exposure; a short's
// collateral is the counter leg it deposited, recovered as its equity plus the debt marked back to
// collateral (a short's equity is that collateral minus the debt's value). A short's `size` is its debt
// leg, never its collateral, so it must not stand in here.
export function collateralHeld({
  direction,
  exposure,
  equity,
  debt,
  mark,
}: {
  direction: MarginDirection | undefined
  // The exposure amount in collateral units (a long's size); the long branch's whole answer.
  exposure: number
  // Live equity in collateral units.
  equity: number
  // Live debt in debt-token units.
  debt: number
  // undefined where the position states no usable price. Only the SHORT branch reads it, and it
  // refuses rather than taking a fabricated 0: callers previously passed `mark ?? 0` and were correct
  // only because of which branch reads it — an invariant living in a different file from the `??`.
  mark: number | undefined
}): number | undefined {
  if (direction !== 'SHORT') {
    return exposure
  }
  return mark === undefined ? undefined : equity + debtInCollateralUnits({ debtAmount: debt, mark, direction })
}

// The projected debt, DEBT-token display units. The quote reports no debt figure, but its projection
// determines one: a SHORT's exposure IS its debt leg, and a LONG borrows the slice of notional its
// equity does not fund. `mark` is counter-per-exposure — the position's oracle where the caller holds
// one, else the quote's own effective price. undefined when an input the branch needs is absent, never
// a fabricated zero.
export function projectedDebtAmount({
  quote,
  mark,
}: {
  quote: MarginQuoteResponse
  mark?: number
}): number | undefined {
  const { size, leverage, effectivePrice } = quote.display
  if (size === undefined) {
    return undefined
  }
  const exposure = rawToNumber({ raw: size, decimals: quote.exposureToken.decimals })
  if (quote.direction === 'SHORT') {
    return exposure
  }
  const price = mark ?? (effectivePrice === undefined ? undefined : scaledE18ToNumber(effectivePrice))
  const leverageNumber = leverage === undefined ? undefined : Number(leverage)
  // `price <= 0` alongside the rest: `mark ?? …` keeps a literal 0 (not nullish), and an
  // effectivePrice of '0' is the wire's absent sentinel — either way `exposure * 0 * …` would report a
  // leveraged LONG as borrowing nothing, which is the fabricated zero this function promises not to
  // return. Every sibling here already refuses a non-positive mark.
  if (
    price === undefined ||
    !Number.isFinite(price) ||
    price <= 0 ||
    leverageNumber === undefined ||
    !Number.isFinite(leverageNumber) ||
    leverageNumber <= 0
  ) {
    return undefined
  }
  // Floored: under 1x there is nothing borrowed, and the formula would report a negative debt.
  return Math.max(0, exposure * price * (1 - 1 / leverageNumber))
}

// Accrued interest (normalized debt-token units) → ≈USD. LONG debt is the stable leg (≈USD as-is);
// SHORT debt is the volatile leg (× mark).
export function accruedUsd({
  accrued,
  direction,
  mark,
}: {
  accrued: number
  direction: MarginDirection | undefined
  mark: number
}): number {
  return direction === 'SHORT' ? accrued * mark : accrued
}

// Sign-correct fiat for a signed value. The shared fiat formatter buckets a sub-dust magnitude to
// "<$0.00000001" and drops the sign; format the magnitude and reapply the sign so a tiny NEGATIVE reads
// ">-$0.00000001" instead of a positive-looking "<$…". Positives keep the existing "+" convention.
export function formatSignedFiat({ value, format }: { value: number; format: (n: number) => string }): string {
  if (value >= 0) {
    return `+${format(value)}`
  }
  const magnitude = format(Math.abs(value))
  return magnitude.startsWith('<') ? `>-${magnitude.slice(1)}` : `-${magnitude}`
}

// Unit symbol for a 1-unit price quote (e.g. "1 {symbol} = $…" liquidation price): always the
// volatile leg, unwrapped for display (WETH → ETH).
export function marginPriceUnitSymbol({
  collateral,
  debt,
  direction,
}: {
  collateral: MarginTokenInfo
  debt: MarginTokenInfo
  direction?: MarginDirection
}): string {
  return marginUnwrapSymbol(marginPairLegs({ collateral, debt, direction }).base)
}
