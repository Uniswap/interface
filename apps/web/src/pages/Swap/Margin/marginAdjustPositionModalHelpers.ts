// Pure display/derivation helpers for the manage sheets, extracted so the components stay a
// straightforward "wire hooks to JSX" — the branchy per-field derivation lives here instead.
//
// No longer scoped to MarginAdjustPositionModal: `clampManageLeverage` and `computeDisplayedLeverage`
// are the cross-sheet leverage rules, read by useDraggedLeverage (Adjust AND Change leverage) and by
// the readouts on both. That seam has produced enough findings that a reader trusting a one-modal
// header would look for the clamp everywhere but here.
import type {
  MarginCreatePlanRequest,
  MarginGasEstimate,
  MarginQuoteResponse,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import type { MarginDirection, MarginPaymentToken } from 'uniswap/src/features/transactions/margin/types'
import { NumberType } from 'utilities/src/format/types'
import { formatUnits } from '~/chains'
import { MARGIN_CHAIN_ID } from '~/constants/margin'
import { type AdjustFunding } from '~/pages/Swap/Margin/hooks/useMarginQuote'
import {
  type AdjustLeverageMode,
  hasInsufficientAddBalance,
  isWithdrawOverMax,
} from '~/pages/Swap/Margin/marginAdjustPositionGate'
import { driftLeverageForEquityDelta } from '~/pages/Swap/Margin/marginAdjustPositionMath'
import {
  conversionCaptionEquity,
  rawToNumber,
  scaledE18ToNumber,
  usablePriceX18,
  usableWireAmount,
} from '~/pages/Swap/Margin/marginFormat'
import { MANAGE_MIN_LEVERAGE } from '~/pages/Swap/Margin/marginOpenButtonGate'

// Re-exported so this module's importers keep one entry point; the implementation lives in
// marginFormat, where a precision fix reaches every caller at once.
export { rawToNumber }

// Six significant digits is enough to recognise your own margin; the raw 18-decimal equity
// (0.016225510668…) overflows the field and reads as noise. Truncating the PREFILL is safe because
// deriveEquityDeltaRaw returns 0n until the field is dirty and then dusts anything under
// ADJUST_EQUITY_DUST_TENTH_BPS, so a truncation-scale residue can never reach the wire.
//
// Works on the decimal STRING, never a float: Number('0.053').toFixed(18) is '0.052999999999999999',
// which would reintroduce the very tail this removes. Truncating rather than rounding also guarantees
// the prefill never claims more equity than the position holds.
const PREFILL_SIG_DIGITS = 6

export function formatMarginPrefill({ raw, decimals }: { raw: bigint; decimals: number }): string {
  const full = formatUnits(raw, decimals)
  // indexOf, not destructuring: split() types every element as string, so a `fraction === undefined`
  // guard reads as dead to the type-aware lint even though a 0-decimal token produces exactly that.
  const dot = full.indexOf('.')
  if (dot === -1) {
    return full
  }
  const whole = full.slice(0, dot)
  const fraction = full.slice(dot + 1)
  const wholeSigDigits = whole === '0' ? 0 : whole.length
  if (wholeSigDigits >= PREFILL_SIG_DIGITS) {
    return whole
  }
  // Leading zeros of a sub-1 amount are placeholders, not significant digits, so they all survive.
  const leadingZeros = fraction.length - fraction.replace(/^0+/, '').length
  const keep = wholeSigDigits > 0 ? PREFILL_SIG_DIGITS - wholeSigDigits : leadingZeros + PREFILL_SIG_DIGITS
  const kept = fraction.slice(0, keep).replace(/0+$/, '')
  return kept ? `${whole}.${kept}` : whole
}

// USD-price-ratio conversion between two token amounts (display-only estimate — mirrors
// deriveAdjustFunding's own ΔE→pay-token conversion, inverted here for the min/max helper caption).
export function convertByUsdPrice({
  amount,
  fromUsdPrice,
  toUsdPrice,
}: {
  amount: number
  fromUsdPrice?: number
  toUsdPrice?: number
}): number | undefined {
  if (fromUsdPrice === undefined || fromUsdPrice <= 0 || toUsdPrice === undefined || toUsdPrice <= 0) {
    return undefined
  }
  return (amount * fromUsdPrice) / toUsdPrice
}

export function computeAdjustMode({
  draggedLeverage,
  lockLeverage,
}: {
  draggedLeverage?: number
  lockLeverage: boolean
}): AdjustLeverageMode {
  if (draggedLeverage !== undefined) {
    return { kind: 'explicit', value: draggedLeverage }
  }
  return lockLeverage ? { kind: 'locked' } : { kind: 'drift' }
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
  return Math.min(Math.max(leverage, MANAGE_MIN_LEVERAGE), venueCap ?? Number.POSITIVE_INFINITY)
}

// Collapses the three leverage-mode branches into the slider/input's displayed value. `explicit` and
// `drift` are clamped to [MANAGE_MIN_LEVERAGE, the venue's ceiling] — a dragged value belongs on the track, and drift's
// live-computed value is otherwise unbounded — while `locked` takes the floor only, because it READS OUT
// the position's own leverage and capping it would misstate the position (see the note inside).
// The manage floor, not the open one: add-margin drifts leverage arbitrarily close to 1, and the open
// floor would report every such position as 1.10x.
export function computeDisplayedLeverage({
  mode,
  currentLeverage,
  collateral,
  debt,
  mark,
  deltaE,
  collateralDecimals,
  direction,
  venueCap,
}: {
  mode: AdjustLeverageMode
  currentLeverage: number
  // undefined where the position's balance-sheet collateral cannot be measured — collateralHeld refuses
  // a SHORT with no usable mark. Only the drift projection reads it.
  collateral: number | undefined
  debt: number
  mark: number
  deltaE: bigint
  collateralDecimals: number
  direction: MarginDirection
  venueCap: number | undefined
}): number {
  // `locked` is a READOUT of the position's own leverage, not a value the user is choosing, so it is
  // not capped: showing the cap for a position that drifted above it misstates the position itself,
  // the same error the MANAGE_MIN_LEVERAGE floor avoids at the other end. The slider pins its own thumb
  // at `cap`, so an over-cap readout renders without overflowing the track.
  //
  // The readout is NOT always what the request wires. Above the venue's published ceiling a non-
  // withdraw adjust deliberately sends no target at all (`canPinLockedTarget` in useMarginAdjustController)
  // — the venue can no longer honour "hold my leverage", so the request holds DEBT instead and walks
  // leverage back toward the cap. The figure here still states what the position holds today.
  if (mode.kind === 'locked') {
    return Math.max(currentLeverage, MANAGE_MIN_LEVERAGE)
  }
  if (mode.kind === 'explicit') {
    return clampManageLeverage({ leverage: mode.value, venueCap })
  }
  const drift =
    collateral === undefined
      ? undefined
      : driftLeverageForEquityDelta({
          collateral,
          debt,
          mark,
          deltaCollateral: Number(deltaE) / 10 ** collateralDecimals,
          direction,
        })
  // undefined and +Infinity are DIFFERENT claims and must not collapse. undefined means the projection
  // could not be computed at all (an unpriceable mark), and there is nothing to state — drift SENDS NO
  // TARGET (getAdjustTargetLeverageX18 returns undefined for it), so no request can disagree with
  // falling back to what the position holds today, the same figure `locked` shows. +Infinity is a real
  // answer: the projection lands at or past liquidation. Substituting the current leverage THERE would
  // render the most dangerous state on this sheet as "nothing is changing", so it passes through — the
  // slider pins at its ceiling, the track colour reads at-risk, and the numeric field prints ∞.
  if (drift === undefined) {
    return Math.max(currentLeverage, MANAGE_MIN_LEVERAGE)
  }
  // NOT clamped to the venue ceiling. `clampManageLeverage` bounds a value the user CHOSE, because the
  // request wires it and the venue would refuse it. A projection is neither: drift sends no target, so
  // the server bounds the withdraw by `maxWithdrawable` — a health-floor limit that sits ABOVE the venue
  // cap — and the position genuinely lands where this figure says. Substituting the ceiling printed
  // 5.00x for a withdraw landing at 7x, with Confirm armed: the same reassuring-substitution failure the
  // +Infinity passthrough above exists to avoid. The floor stays — it is a display convention for a
  // drift arbitrarily close to 1, not a claim about a bound.
  return Math.max(drift, MANAGE_MIN_LEVERAGE)
}

// Margin-input helper-line range: min = current − server maxWithdrawable; max = current + spendable
// payment-token balance in collateral terms (an estimate when paying with a different token).
export function computeMarginHelperRange({
  currentEquityHuman,
  maxWithdrawableRaw,
  collateralDecimals,
  spendableBalanceRaw,
  paymentTokenDecimals,
  isPaymentTokenCollateral,
  paymentTokenUsdPrice,
  collateralUsdPrice,
}: {
  currentEquityHuman: number
  maxWithdrawableRaw?: string
  collateralDecimals: number
  spendableBalanceRaw?: string
  paymentTokenDecimals: number
  isPaymentTokenCollateral: boolean
  paymentTokenUsdPrice?: number
  collateralUsdPrice: number
}): { min?: number; max?: number; spendableBalanceHuman?: number } {
  const min =
    maxWithdrawableRaw !== undefined
      ? Math.max(currentEquityHuman - rawToNumber({ raw: maxWithdrawableRaw, decimals: collateralDecimals }), 0)
      : undefined
  const spendableBalanceHuman =
    spendableBalanceRaw !== undefined
      ? rawToNumber({ raw: spendableBalanceRaw, decimals: paymentTokenDecimals })
      : undefined
  const spendableInCollateralHuman =
    spendableBalanceHuman === undefined
      ? undefined
      : isPaymentTokenCollateral
        ? spendableBalanceHuman
        : convertByUsdPrice({
            amount: spendableBalanceHuman,
            fromUsdPrice: paymentTokenUsdPrice,
            toUsdPrice: collateralUsdPrice,
          })
  const max = spendableInCollateralHuman !== undefined ? currentEquityHuman + spendableInCollateralHuman : undefined
  return { min, max, spendableBalanceHuman }
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

export function computeFundingDisplay({
  funding,
  paymentToken,
  collateralDecimals,
  paymentTokenUsdPrice,
  equityInRaw,
  isPaymentTokenCollateral,
  isQuoteStale,
}: {
  funding: AdjustFunding
  paymentToken: MarginPaymentToken
  collateralDecimals: number
  paymentTokenUsdPrice?: number
  // The LIVE quote's landed-collateral leg, not the latched one — a stale conversion caption would
  // read as an authoritative figure.
  equityInRaw?: string
  isPaymentTokenCollateral: boolean
  // Debounce or placeholder refetch in flight. The caption's other half is the live input, so the two
  // would describe different amounts.
  isQuoteStale: boolean
}): { depositAmountHuman: number; depositUsdValue?: number; withdrawAmountHuman: number; equityInHuman?: number } {
  const depositAmountHuman =
    funding.kind === 'deposit' && funding.paymentAmountRaw
      ? rawToNumber({ raw: funding.paymentAmountRaw, decimals: paymentToken.decimals })
      : 0
  const depositUsdValue = paymentTokenUsdPrice !== undefined ? depositAmountHuman * paymentTokenUsdPrice : undefined
  const withdrawAmountHuman =
    funding.kind === 'withdraw' ? rawToNumber({ raw: funding.withdrawAmountRaw, decimals: collateralDecimals }) : 0
  // Through the shared rule rather than a local truthiness test: '0' is a truthy STRING, so the plain
  // test admitted the wire's absent sentinel and captioned it as "≈ 0".
  const equityInHuman = conversionCaptionEquity({
    equityInRaw,
    decimals: collateralDecimals,
    isPaymentTokenCollateral,
    isQuoteStale,
  })
  return { depositAmountHuman, depositUsdValue, withdrawAmountHuman, equityInHuman }
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

// Max must always produce a SUBMITTABLE amount. `maxMarginHuman` is a double, and `toFixed(decimals)`
// writes its full binary expansion — on 18-decimal collateral that can land a few hundred wei ABOVE the
// true ceiling, so pressing Max leaves Confirm disabled on `insufficientBalance`, on roughly a coin
// flip of the ULP's sign. Floor on the decimal STRING (the technique floorTo2 uses in
// marginAdjustPositionGate) a few orders above wei: the discarded amount is economically nil and the
// result can never exceed the ceiling. Sibling modals avoid this by staying in bigint
// (MarginAddModal) or by an explicit haircut (MarginWithdrawModal); neither shape fits here, because
// the max is only an ESTIMATE whenever the payment token differs from the collateral.
const MAX_FILL_PRECISION_GUARD = 6

export function floorToSubmittable({ value, decimals }: { value: number; decimals: number }): string {
  // Rendered wider than needed and then TRUNCATED — never `toFixed(decimals)` on its own, which rounds
  // half-up and would break the never-exceeds contract on a token with few decimals (a cross-token max
  // is a USD-ratio estimate, so 1.4999999 at 6dp would round up to 1.500000 and overshoot the balance).
  // Shed the guard digits where the token has room; otherwise keep every decimal it has. Either way
  // the value is TRUNCATED, never rounded — that is the half the never-exceeds contract rests on.
  const keep = decimals > MAX_FILL_PRECISION_GUARD ? decimals - MAX_FILL_PRECISION_GUARD : decimals
  // Rendered EXACT, not merely wide. toFixed rounds at its last digit wherever that falls, so any
  // finite width lets a run of 9s below the cut carry into the kept digits and exceed `value`
  // (2.99999999 at 6dp → '3.000000'). A double's decimal expansion terminates well inside 100 places
  // for any amount this field can hold, so at 100 there is nothing left to round and the slice below
  // is a true floor.
  const wide = value.toFixed(100)
  const dot = wide.indexOf('.')
  // |value| >= 1e21 renders in exponential form and carries no fraction to cut.
  return dot === -1 ? wide : wide.slice(0, dot + 1 + keep)
}
