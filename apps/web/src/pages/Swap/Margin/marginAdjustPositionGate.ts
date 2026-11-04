// Confirm-gate + leverage-target derivation for the ADJUST-intent manage modals (add margin, withdraw,
// change leverage). Extracted so the fund-safety guards are unit-testable — pattern: marginCloseGate.ts.
import { parseUnits } from '~/chains'
import type { AdjustFunding } from '~/pages/Swap/Margin/hooks/useMarginQuote'

// Minimum |target − current| leverage change the CTA accepts. Below this, the echo tolerance vs a tiny
// delta produces spurious create-time 400s (interest accrual + mark drift dwarf a small delta), so the
// CTA stays disabled rather than pricing a change the backend would reject.
export const ADJUST_MIN_LEVERAGE_DELTA = 0.05

export type AdjustLeverageMode =
  | { kind: 'drift' } // slider untouched — leverage floats as the funding change lands
  | { kind: 'explicit'; value: number } // slider dragged / numeric input committed

// Wire target leverage for the quote request. drift sends no target (server holds debt constant);
// explicit sends the dragged value, FLOORED to 2 decimals before the WAD scale, matching the
// leverage-modal's round-trip convention (the echo compares this string exactly). A real floor, not
// toFixed's round-to-nearest: a floor only ever errs toward less debt.
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

export function getAdjustTargetLeverageX18({ mode }: { mode: AdjustLeverageMode }): string | undefined {
  switch (mode.kind) {
    case 'drift':
      return undefined
    case 'explicit': {
      const floored = floorTo2(mode.value)
      return floored === '' ? undefined : parseUnits(floored, 18).toString()
    }
    default:
      return undefined
  }
}

// Whether the adjust has anything to submit: a nonzero funding, OR an explicit leverage target that
// clears the min-delta deadband. drift has no target at all, so it never contributes a change on its
// own — only the funding side can.
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
  // A deposit with an empty payment amount is unpriceable. Add margin maps blank input to 'none' and the
  // request builder refuses it too, so this is redundant today — but it keeps the invariant local
  // instead of inherited from a module three files away.
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

// Caps the withdraw amount against the server's health-floor-constrained max. Permissive (false) until
// the max has loaded.
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

// Fed Add margin's typed deposit amount, in pay-token units. Stays permissive until the first
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
