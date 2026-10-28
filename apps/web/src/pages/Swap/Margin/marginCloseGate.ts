// Confirm-gate decision for the close modal, extracted so the fund-safety guards are unit-testable.
import { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import { collateralHeld, rawToNumber } from '~/pages/Swap/Margin/marginFormat'

// The exit swap sells collateral to buy back the debt; if the slippage-padded collateral it may spend
// (`maxCollateralIn`) exceeds the collateral the position holds, it reverts, so the modal blocks the
// close. Both compared in collateral units via collateralHeld — measuring a short against its `size`
// (the debt leg) reads ~1e12-too-large, which is why the guard never fired for shorts.
export function isCloseUnderwater(input: {
  maxCollateralIn: string | undefined
  direction: MarginDirection
  size: string
  equity: string
  debt: string
  collateralDecimals: number
  debtDecimals: number
  // undefined where the position states no usable price. A SHORT's held collateral is
  // `equity + debt x mark`, so without one there is no figure to compare against.
  mark: number | undefined
}): boolean {
  if (input.maxCollateralIn === undefined) {
    return false
  }
  const held = collateralHeld({
    direction: input.direction,
    // `size` is the EXPOSURE leg, and a SHORT's exposure IS its debt leg — so it carries the debt
    // token's decimals there, not the collateral's. Inert today because the SHORT branch answers from
    // `equity + debt x mark` and never reads `exposure`, but a ~1e12 error sitting behind that coupling
    // is a landmine for whoever next touches collateralHeld.
    exposure: rawToNumber({
      raw: input.size,
      decimals: input.direction === MarginDirection.SHORT ? input.debtDecimals : input.collateralDecimals,
    }),
    equity: rawToNumber({ raw: input.equity, decimals: input.collateralDecimals }),
    debt: rawToNumber({ raw: input.debt, decimals: input.debtDecimals }),
    mark: input.mark,
  })
  // Fail OPEN where the position cannot be measured — collateralHeld refuses a SHORT with no usable
  // mark. This guard exists to stop a close that would revert, so refusing one on a position it cannot
  // measure would strand the funds the close releases. (A SHORT's held collateral computed at a mark of
  // 0 collapses to its equity alone, which reads as underwater on a perfectly healthy short and blocks
  // its only exit — which is what a fabricated zero here used to do.)
  if (held === undefined) {
    return false
  }
  return rawToNumber({ raw: input.maxCollateralIn, decimals: input.collateralDecimals }) > held
}

// A debt-free close needs no quote (no swap); a close with debt requires a fresh, settled, non-underwater
// quote. `isDebouncing` guards against confirming a stale quote, and `isPlaceholderData` covers the same
// hazard on the other side of the shared quote hook's keepPreviousData bridge — a slippage change
// re-keys the query, and the bridged quote was priced at the OLD bound. `isPlanInFlight` mirrors the
// OPEN CTA's single-flight pre-emption — executePlan silently no-ops while another plan holds the lock.
export function getCloseConfirmDisabled(input: {
  canManage: boolean
  hasAccount: boolean
  hasDebt: boolean
  hasQuote: boolean
  isQuoteLoading: boolean
  isDebouncing: boolean
  isPlaceholderData: boolean
  hasQuoteError: boolean
  underwater: boolean
  isPlanInFlight: boolean
  // The debt-free arm has no polled quote (the hook gates on debt) and fetches one on press, so its
  // in-flight state lives in the modal. It belongs in the predicate all the same — "can Close be
  // pressed" should have one home, or the next blocking condition lands in only one of the two.
  isFetchingDebtFreeQuote?: boolean
}): boolean {
  if (!input.canManage || !input.hasAccount || input.isPlanInFlight || input.isFetchingDebtFreeQuote) {
    return true
  }
  if (!input.hasDebt) {
    return false
  }
  return (
    !input.hasQuote ||
    input.isQuoteLoading ||
    input.isDebouncing ||
    input.isPlaceholderData ||
    input.hasQuoteError ||
    input.underwater
  )
}
