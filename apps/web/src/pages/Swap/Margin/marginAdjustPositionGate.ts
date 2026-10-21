// Confirm-gate + funding/leverage derivation for the unified Adjust-position modal (a single margin
// input drives both the funding direction and the leverage target). Extracted so the fund-safety
// guards are unit-testable — pattern: marginCloseGate.ts.
import { parseUnits } from '~/chains'
import type { AdjustFunding } from '~/pages/Swap/Margin/hooks/useMarginQuote'

// Minimum |target − current| leverage change the CTA accepts. Below this, the echo tolerance vs a tiny
// delta produces spurious create-time 400s (interest accrual + mark drift dwarf a small delta), so the
// CTA stays disabled rather than pricing a change the backend would reject.
export const ADJUST_MIN_LEVERAGE_DELTA = 0.05

export type AdjustLeverageMode =
  | { kind: 'drift' } // lock OFF, slider untouched — leverage floats as the funding change lands
  | { kind: 'locked' } // lock ON — target = current (debt moves to hold leverage constant)
  | { kind: 'explicit'; value: number } // slider dragged / numeric input committed

// Wire target leverage for the quote request. drift sends no target (server holds debt constant);
// locked pins it at the position's current leverage; explicit sends the dragged value. Both non-drift
// cases FLOOR to 2 decimals before the WAD scale, matching the leverage-modal's round-trip convention
// (the echo compares this string exactly). A real floor, not toFixed's round-to-nearest: `locked`
// exists to hold leverage constant, so rounding up would wire slightly MORE leverage than the position
// holds — a floor only ever errs toward less debt.
// Floors on the decimal STRING rather than the float product: `2.30 * 100` is 229.99999999999997, so
// Math.floor would take a full cent off values that are exactly representable as decimals (2.30, 1.15,
// 2.51, 4.10 …). Truncating a wide fixed rendering is exact for the magnitudes leverage takes.
export function floorTo2(value: number): string {
  // Non-finite would render "NaN"/"Infinity", whose indexOf('.') is -1 — the slice would yield "Na"
  // and parseUnits throws on it during render. Refuse rather than emit a malformed decimal.
  if (!Number.isFinite(value)) {
    return ''
  }
  const wide = value.toFixed(10)
  return wide.slice(0, wide.indexOf('.') + 3)
}

export function getAdjustTargetLeverageX18({
  mode,
  currentLeverage,
}: {
  mode: AdjustLeverageMode
  currentLeverage: number
}): string | undefined {
  switch (mode.kind) {
    case 'drift':
      return undefined
    case 'locked': {
      const floored = floorTo2(currentLeverage)
      return floored === '' ? undefined : parseUnits(floored, 18).toString()
    }
    case 'explicit': {
      const floored = floorTo2(mode.value)
      return floored === '' ? undefined : parseUnits(floored, 18).toString()
    }
    default:
      return undefined
  }
}

// --- single-margin-input derivation: one amount field drives both funding and leverage target ---

// Dust deadband for the margin input's derived ΔE, in tenths of a bp of live current equity. Sized
// against what it exists to absorb: the prefill is truncated to 6 significant digits, so re-typing it
// leaves at most ~0.1 bp of residue. A wider band would silently swallow real edits — on a large
// position 5 bps is hundreds of dollars, and the CTA gives no hint that anything was dropped.
export const ADJUST_EQUITY_DUST_TENTH_BPS = 5

function absBigInt(value: bigint): bigint {
  return value < 0n ? -value : value
}

// Parses the margin input into raw collateral units. Unlike a deposit/withdraw amount, 0 is a valid
// target equity (a full withdraw-to-zero) — only blank/non-numeric/negative input is unparseable.
function parseMarginTargetRaw({
  marginInput,
  collateralDecimals,
}: {
  marginInput: string
  collateralDecimals: number
}): bigint | undefined {
  const trimmed = marginInput.trim()
  if (!trimmed || Number.isNaN(Number(trimmed)) || Number(trimmed) < 0) {
    return undefined
  }
  try {
    return BigInt(parseUnits(trimmed, collateralDecimals).toString())
  } catch {
    return undefined
  }
}

// ΔE = target equity (parsed from the input) − live current equity, in raw collateral units. An
// untouched input reads as the EXACT pre-fill baseline (0n) rather than round-tripping the
// display-rounded string back through parseUnits, which would fabricate a phantom sub-dust delta. A
// small deadband around 0 (ADJUST_EQUITY_DUST_TENTH_BPS of current equity) absorbs re-typing the same
// rounded value. Unparseable input reads as untouched (0n) — never a fabricated huge withdrawal.
export function deriveEquityDeltaRaw({
  marginInput,
  marginInputDirty,
  currentEquityRaw,
  collateralDecimals,
}: {
  marginInput: string
  marginInputDirty: boolean
  currentEquityRaw: bigint
  collateralDecimals: number
}): bigint {
  if (!marginInputDirty) {
    return 0n
  }
  const target = parseMarginTargetRaw({ marginInput, collateralDecimals })
  if (target === undefined) {
    return 0n
  }
  const delta = target - currentEquityRaw
  const dustThreshold = (absBigInt(currentEquityRaw) * BigInt(ADJUST_EQUITY_DUST_TENTH_BPS)) / 100_000n
  return absBigInt(delta) < dustThreshold ? 0n : delta
}

// Converts a raw collateral-unit delta to raw pay-token units via a USD price ratio: human collateral
// amount × (collateralUsdPrice / paymentTokenUsdPrice), rescaled to paymentTokenDecimals. Goes through
// parseUnits (decimal-string based) rather than `Math.round(human * 10 ** decimals)` — for 18-decimal
// tokens that float multiplication overflows Number.MAX_SAFE_INTEGER well within ordinary human
// amounts. This is explicitly an ESTIMATE (see deriveAdjustFunding) so the float human-amount step is
// acceptable; only the final decimals rescale needs the precision care.
function scaleDeltaToPaymentToken({
  deltaCollateralRaw,
  collateralDecimals,
  paymentTokenDecimals,
  collateralUsdPrice,
  paymentTokenUsdPrice,
}: {
  deltaCollateralRaw: bigint
  collateralDecimals: number
  paymentTokenDecimals: number
  collateralUsdPrice: number
  paymentTokenUsdPrice: number
}): string {
  const deltaCollateralHuman = Number(deltaCollateralRaw) / 10 ** collateralDecimals
  const paymentAmountHuman = (deltaCollateralHuman * collateralUsdPrice) / paymentTokenUsdPrice
  try {
    return parseUnits(paymentAmountHuman.toFixed(paymentTokenDecimals), paymentTokenDecimals).toString()
  } catch {
    // toFixed emits exponential notation at ~1e21 and up, which parseUnits rejects — and this runs
    // during render, so an unhandled throw takes the modal out. Degrade to the unpriceable sentinel
    // the callers already handle.
    return ''
  }
}

// Maps a derived ΔE (raw collateral units) to what the quote request must carry. Δ=0 → none; Δ<0 →
// withdraw −Δ (already in collateral units — no conversion). Δ>0 needs a deposit: paying with the
// collateral token itself is an EXACT passthrough (no price lookup, no decimals rescale — same token,
// same decimals, by construction); paying with anything else is an ESTIMATE via the USD price ratio —
// the quote's expectedEquity is the authoritative landed margin and the echo bounds absorb the drift.
// Either USD price missing OR non-positive (a broken feed, same defensive reasoning as
// currentEquityRawFromPosition's mark guard) disables the CTA rather than pricing off a bad ratio.
export function deriveAdjustFunding({
  deltaCollateralRaw,
  paymentTokenDecimals,
  collateralDecimals,
  isPaymentTokenCollateral,
  collateralUsdPrice,
  paymentTokenUsdPrice,
}: {
  deltaCollateralRaw: bigint
  paymentTokenDecimals: number
  collateralDecimals: number
  isPaymentTokenCollateral: boolean
  collateralUsdPrice?: number
  paymentTokenUsdPrice?: number
}): AdjustFunding {
  if (deltaCollateralRaw === 0n) {
    return { kind: 'none' }
  }
  if (deltaCollateralRaw < 0n) {
    return { kind: 'withdraw', withdrawAmountRaw: (-deltaCollateralRaw).toString() }
  }
  if (isPaymentTokenCollateral) {
    return { kind: 'deposit', paymentAmountRaw: deltaCollateralRaw.toString() }
  }
  if (
    collateralUsdPrice === undefined ||
    collateralUsdPrice <= 0 ||
    paymentTokenUsdPrice === undefined ||
    paymentTokenUsdPrice <= 0
  ) {
    return { kind: 'deposit', paymentAmountRaw: '' }
  }
  return {
    kind: 'deposit',
    paymentAmountRaw: scaleDeltaToPaymentToken({
      deltaCollateralRaw,
      collateralDecimals,
      paymentTokenDecimals,
      collateralUsdPrice,
      paymentTokenUsdPrice,
    }),
  }
}

// Whether the adjust has anything to submit: a nonzero derived funding, OR an explicit leverage target
// that clears the min-delta deadband. drift and locked both hold leverage at "no change" (locked's
// target IS current by construction; drift has no target at all) — neither ever contributes a change
// on its own, only the funding side can.
export function hasAdjustChange({
  funding,
  mode,
  currentLeverage,
}: {
  funding: AdjustFunding
  mode: AdjustLeverageMode
  currentLeverage: number
}): boolean {
  if (funding.kind !== 'none') {
    return true
  }
  if (mode.kind !== 'explicit') {
    return false
  }
  return Math.abs(mode.value - currentLeverage) >= ADJUST_MIN_LEVERAGE_DELTA
}

// Disable Confirm unless: the position is manageable, an account is connected, there's an actual
// change to submit, a fresh settled quote is in hand (a change-free "preview" quote can no longer be
// fetched at all, so holding a quote is the whole test), nothing is loading/bridging/debouncing,
// the wallet covers any deposit, any withdraw stays under the server max, the visible input matches
// what was debounced/priced, and no plan is already in flight.
//
// Takes isPlaceholderData, NOT isFetching: the ~15s background refetch sets isFetching on a quote
// that is still exactly current, and gating on it silently kills the CTA for the poll's duration.
// isPlaceholderData is true exactly while a NEW key's fetch is bridged by the previous key's data —
// the only case where the in-hand echo does not describe what the user is looking at.
//
// hasQuoteError is separate from all of the above: React Query keeps `data` on error, so a failing
// SAME-key background poll leaves quote/echo in hand with nothing else set. Without this the modal
// renders its error text in red while the CTA stays live on the now-rejected echo.
export function getAdjustConfirmDisabled({
  canManage,
  hasAccount,
  hasChange,
  funding,
  hasQuote,
  hasQuoteError,
  isQuoteLoading,
  isPlaceholderData,
  isDebouncing,
  insufficientBalance,
  overMax,
  // Renamed on destructure only — the param stays `visibleMatchesSubmitted` in the type below (callers
  // pass that key); the local binding is renamed so it doesn't shadow the exported function of the
  // same name in this file.
  visibleMatchesSubmitted: isVisibleMatchesSubmitted,
  isPlanInFlight,
}: {
  canManage: boolean
  hasAccount: boolean
  hasChange: boolean
  // A deposit whose payment amount never resolved (no USD price) is unpriceable. The request builder
  // already refuses to build it, so this is redundant today — but it keeps the invariant local instead
  // of inherited from a module three files away.
  funding: AdjustFunding
  hasQuote: boolean
  hasQuoteError: boolean
  isQuoteLoading: boolean
  isPlaceholderData: boolean
  isDebouncing: boolean
  insufficientBalance: boolean
  overMax: boolean
  visibleMatchesSubmitted: boolean
  isPlanInFlight: boolean
}): boolean {
  return (
    !canManage ||
    !hasAccount ||
    !hasChange ||
    (funding.kind === 'deposit' && !funding.paymentAmountRaw) ||
    !hasQuote ||
    hasQuoteError ||
    isQuoteLoading ||
    isPlaceholderData ||
    isDebouncing ||
    insufficientBalance ||
    overMax ||
    !isVisibleMatchesSubmitted ||
    isPlanInFlight
  )
}

// Caps −ΔE against the server's health-floor-constrained max. Permissive (false) until the max has loaded.
export function isWithdrawOverMax({
  withdrawAmountRaw,
  maxWithdrawableRaw,
}: {
  withdrawAmountRaw?: string
  maxWithdrawableRaw?: string
}): boolean {
  if (!withdrawAmountRaw || maxWithdrawableRaw === undefined) {
    return false
  }
  return BigInt(withdrawAmountRaw) > BigInt(maxWithdrawableRaw)
}

// Fed the DERIVED deposit amount rather than a user-typed one. Stays permissive until the first
// portfolio read lands so the CTA isn't blocked prematurely.
export function hasInsufficientAddBalance({
  rawAmount,
  spendableBalanceRaw,
  portfolioLoaded,
}: {
  rawAmount: string | undefined
  spendableBalanceRaw: string | undefined
  portfolioLoaded: boolean
}): boolean {
  if (!rawAmount) {
    return false
  }
  if (spendableBalanceRaw !== undefined) {
    return BigInt(rawAmount) > BigInt(spendableBalanceRaw)
  }
  return portfolioLoaded
}

// The debounced submitted raw must equal the raw parsed from the CURRENTLY VISIBLE input, so a
// request can never carry an amount the user isn't looking at (belt-and-suspenders with the
// isDebouncing gate).
export function visibleMatchesSubmitted({
  visibleRaw,
  submittedRaw,
}: {
  visibleRaw: string | undefined
  submittedRaw: string | undefined
}): boolean {
  return visibleRaw !== undefined && submittedRaw !== undefined && visibleRaw === submittedRaw
}
