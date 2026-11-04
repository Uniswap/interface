// Pure display/derivation helpers for the manage sheets, extracted so the components stay a
// straightforward "wire hooks to JSX" — the branchy per-field derivation lives here instead.
//
// `clampManageLeverage` is the cross-sheet leverage rule, read by useDraggedLeverage and by the
// Change-leverage readout.
import type {
  MarginCreatePlanRequest,
  MarginGasEstimate,
  MarginQuoteResponse,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { NumberType } from 'utilities/src/format/types'
import { MARGIN_CHAIN_ID } from '~/constants/margin'
import { scaledE18ToNumber, usablePriceX18, usableWireAmount } from '~/features/margin/utils/marginFormat'
import { type AdjustFunding } from '~/pages/Swap/Margin/hooks/useMarginQuote'
import { hasInsufficientAddBalance, isWithdrawOverMax } from '~/pages/Swap/Margin/marginAdjustPositionGate'
import { MANAGE_MIN_LEVERAGE } from '~/pages/Swap/Margin/marginOpenButtonGate'

// [min, max], with no ceiling while `max` is unknown.
export function clampLeverage({
  leverage,
  min,
  max,
}: {
  leverage: number
  min: number
  max: number | undefined
}): number {
  return Math.min(Math.max(leverage, min), max ?? Number.POSITIVE_INFINITY)
}

/**
 * Holds a user-CHOSEN manage leverage inside the range the venue actually offers.
 *
 * The ceiling is the venue's PUBLISHED one, never the slider's floored `cap`: a market publishing no
 * ceiling floors `cap` to MIN_LEVERAGE, so bounding a chosen value there would snap it to the floor
 * with no way back — the same reason `shouldClampLeverageToCap` refuses to clamp without one. Every
 * site that bounds a chosen leverage goes through here; the readout and the wire disagreeing about
 * what Confirm submits is what two copies of this rule produced.
 */
export function clampManageLeverage({
  leverage,
  venueCap,
}: {
  leverage: number
  venueCap: number | undefined
}): number {
  return clampLeverage({ leverage, min: MANAGE_MIN_LEVERAGE, max: venueCap })
}

export function computeFundingRisk({
  funding,
  maxWithdrawableRaw,
  spendableBalanceRaw,
  portfolioLoaded,
}: {
  funding: AdjustFunding
  maxWithdrawableRaw?: string
  spendableBalanceRaw?: string
  portfolioLoaded: boolean
}): { overMax: boolean; insufficientBalance: boolean } {
  const overMax =
    funding.kind === 'withdraw'
      ? isWithdrawOverMax({ withdrawAmountRaw: funding.withdrawAmountRaw, maxWithdrawableRaw })
      : false
  const insufficientBalance =
    funding.kind === 'deposit'
      ? hasInsufficientAddBalance({
          rawAmount: funding.paymentAmountRaw || undefined,
          spendableBalanceRaw,
          portfolioLoaded,
        })
      : false
  return { overMax, insufficientBalance }
}

// USD where the server could price it, else the wei figure, else nothing. Both reads go through the
// guarded decoders for the same two reasons: `'0'` is a truthy STRING, so a zero USD figure would
// render "$0.00" for a transaction that really costs gas and suppress the ETH figure one branch down;
// and a bare BigInt() throws a SyntaxError on any non-integer wire value, taking the whole modal down
// mid-render where '—' was the intended fallback.
export function computeGasDisplay({
  gasEstimate,
  formatNumberOrString,
}: {
  gasEstimate?: MarginGasEstimate
  formatNumberOrString: (input: { value: number; type: NumberType }) => string
}): string | undefined {
  if (!gasEstimate) {
    return undefined
  }
  const gasFeeUsd = usablePriceX18(gasEstimate.gasFeeUsd)
  if (gasFeeUsd !== undefined) {
    return formatNumberOrString({ value: scaledE18ToNumber(gasFeeUsd), type: NumberType.FiatGasPrice })
  }
  const gasFeeEth = usableWireAmount({ raw: gasEstimate.gasFeeWei, decimals: 18 })
  return gasFeeEth === undefined ? undefined : `${gasFeeEth.toFixed(5)} ETH`
}

// True only during an active edit transition — a debounce still counting down, or a keepPreviousData-
// bridged placeholder quote. Deliberately excludes isFetching alone: the ~20s background refetch sets
// that with isPlaceholderData false and must stay silent (the regression this exists to prevent).
export function computeIsEditStale({
  isDebouncing,
  isPlaceholderData,
}: {
  isDebouncing: boolean
  isPlaceholderData: boolean
}): boolean {
  return isDebouncing || isPlaceholderData
}

// Whether the before/after block + gas row should read as stale: an active edit transition, or an
// outright quote error (the latched last-good numbers render dimmed under the error text on a 422).
export function computeIsBeforeAfterDimmed({
  isEditStale,
  hasQuoteError,
}: {
  isEditStale: boolean
  hasQuoteError: boolean
}): boolean {
  return isEditStale || hasQuoteError
}

// First-paint-only gate for the before/after skeleton: nothing to show yet (no live quote, nothing
// latched from a prior one) and a fetch is actually in flight.
export function computeShowInitialSkeleton({
  hasQuote,
  hasLastGoodQuote,
  isQuoteLoading,
  isDebouncing,
}: {
  hasQuote: boolean
  hasLastGoodQuote: boolean
  isQuoteLoading: boolean
  isDebouncing: boolean
}): boolean {
  return !hasQuote && !hasLastGoodQuote && (isQuoteLoading || isDebouncing)
}

// Plan create is quote-only: the adjust quote is echoed back verbatim, so every rail it already
// confirmed (swapConfig, leverageTarget, positionId) needs no restating here.
export function buildAdjustCreateRequest({
  swapper,
  marginQuote,
}: {
  swapper: string
  marginQuote: MarginQuoteResponse
}): MarginCreatePlanRequest {
  return { chainId: MARGIN_CHAIN_ID, swapper, marginQuote }
}
