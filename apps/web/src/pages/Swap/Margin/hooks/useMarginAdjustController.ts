import { areEvmAddressesEqual } from '@universe/chains'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { MarginPosition, MarginQuoteResponse } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useMarginFormStore } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore'
import type { MarginPaymentToken, MarginManageAction } from 'uniswap/src/features/transactions/margin/types'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { type MarginMarket } from '~/constants/margin'
import { useAccount } from '~/hooks/useAccount'
import { useExecuteMarginPlan } from '~/pages/Swap/Margin/hooks/useExecuteMarginPlan'
import { useIsPlanInFlight } from '~/pages/Swap/Margin/hooks/useIsPlanInFlight'
import { useMarginPaymentTokenBalance } from '~/pages/Swap/Margin/hooks/useMarginPaymentTokenBalance'
import { type AdjustFunding, marginQuoteKey, useMarginQuote } from '~/pages/Swap/Margin/hooks/useMarginQuote'
import {
  type AdjustLeverageMode,
  getAdjustConfirmDisabled,
  floorTo2,
  getAdjustTargetLeverageX18,
  hasAdjustChange,
  visibleMatchesSubmitted,
} from '~/pages/Swap/Margin/marginAdjustPositionGate'
import { positionLeverage } from '~/pages/Swap/Margin/marginAdjustPositionMath'
import {
  buildAdjustCreateRequest,
  computeFundingRisk,
  computeGasDisplay,
  computeIsBeforeAfterDimmed,
  computeIsEditStale,
  computeShowInitialSkeleton,
} from '~/pages/Swap/Margin/marginAdjustPositionModalHelpers'
import { getMarketDefaultPaymentToken } from '~/pages/Swap/Margin/marginCurrencies'
import { getMarginLeverageCap, MIN_LEVERAGE } from '~/pages/Swap/Margin/marginOpenButtonGate'
import { isMarginActivePosition, marginPositionSubId } from '~/pages/Swap/Margin/marginPositionRow'
import { getMarginQuoteErrorMessage, type MarginQuoteErrorResult } from '~/pages/Swap/Margin/marginQuoteError'

// keepPreviousData bridges a debounced edit but is DROPPED on error (RQ v5) — quote reverts to undefined
// on a 422, which would otherwise unmount the before/after rows out from under the error text. Latch the
// last non-placeholder quote so those rows can stay mounted (dimmed) instead. Private to this file: its
// correctness depends on isPlaceholderData, which the controller owns.
function useLastGoodQuote({
  quote,
  isPlaceholderData,
}: {
  quote: MarginQuoteResponse | undefined
  isPlaceholderData: boolean
}): MarginQuoteResponse | undefined {
  const [lastGoodQuote, setLastGoodQuote] = useState<MarginQuoteResponse | undefined>(undefined)
  useEffect(() => {
    if (quote && !isPlaceholderData) {
      setLastGoodQuote(quote)
    }
  }, [quote, isPlaceholderData])
  return lastGoodQuote
}

export interface MarginAdjustControllerResult {
  // Latched last-good quote — the ONLY response object returned, so a caller cannot accidentally
  // render stale figures by picking the wrong one. Feeds the before/after rows; a 422 dims them
  // rather than unmounting.
  displayQuote?: MarginQuoteResponse
  // A LIVE scalar — off the position/market rows, never the quote, so it does not go stale under a
  // dimmed or error'd displayQuote.
  maxWithdrawableRaw?: string
  // Off the LIVE quote (never displayQuote), on purpose: it backs the conversion caption, and a
  // caption that outlived its quote would read as an authoritative figure. Absent whenever the quote is.
  equityInRaw?: string
  quoteErrorResult?: MarginQuoteErrorResult
  isQuoteLoading: boolean
  isEditStale: boolean
  dimBeforeAfter: boolean
  showInitialSkeleton: boolean
  cap: number
  // The RAW venue ceiling behind `cap`. undefined means the market publishes none, so `cap` floored to
  // MIN_LEVERAGE and is not an honest ceiling to clamp a user's slider against.
  venueCap?: number
  // Local helper — UNTRUSTWORTHY on debt-free and at/past-LLTV positions, both of which read 1x.
  currentLeverage: number
  // Composed off the POSITION, not the quote (which no longer carries `before`) — the figure Change
  // leverage must display. Absent = block the modal.
  beforeLeverage?: number
  spendableBalanceRaw?: string
  overMax: boolean
  insufficientBalance: boolean
  isPlanInFlight: boolean
  gasDisplay?: string
  confirmDisabled: boolean
  onConfirm: () => void
  paymentToken: MarginPaymentToken
  slippageToleranceBps: number
}

/**
 * The two ceilings a manage sheet needs, derived from the position's own market.
 *
 * Exported because the slider's clamp needs them BEFORE the controller exists — the controller's mode
 * is computed from the slider's value, so the sheet cannot ask the controller for them first. One
 * derivation rather than two: `cap` and `venueCap` are not interchangeable, and a copy that conflated
 * them would clamp against a floored ceiling and reset the slider to the minimum.
 */
export function marginLeverageCaps({ market }: { market: MarginMarket }): {
  venueCap: number | undefined
  cap: number
} {
  // The venue's OWN published ceiling, kept separate from the slider's floored `cap`: absence of a
  // ceiling is a different signal from a low one, and only the raw value can tell them apart.
  const venueCap = getMarginLeverageCap({ markets: [market] })
  return { venueCap, cap: Math.max(venueCap ?? MIN_LEVERAGE, MIN_LEVERAGE) }
}

// Quote → gate → submit for every ADJUST-intent modal (add margin, withdraw, change leverage, and the
// unified advanced modal). Callers own only their own input: the funding delta and the leverage mode.
//
// Takes `mode`, NOT a pre-computed targetLeverageX18. The two are equivalent only because the target
// is gated on hasAdjustChange — without that gate a fresh modal fires a no-op quote the server rejects
// with MARGIN_ADJUST_NO_CHANGE. Owning the gate here means it ships once instead of becoming an
// unwritten precondition every caller re-derives.
//
// Caller contract: blank input MUST produce { kind: 'none' }, never { kind: 'deposit',
// paymentAmountRaw: '' }. An equity-moving key requires a funding rail, so the empty string leaves the
// request unbuildable — the quote never fires, and Confirm stays shut for want of a quote rather than
// by any term in the gate.
export function useMarginAdjustController({
  position,
  market,
  funding,
  mode,
  action,
  paymentToken: paymentTokenInput,
  onClose,
}: {
  position: MarginPosition
  market: MarginMarket
  funding: AdjustFunding
  mode: AdjustLeverageMode
  // Which modal is submitting. Every one of them mints intent: 'ADJUST', so the plan cannot name the
  // user's action afterwards — this rides the execution store through to the completion toast.
  action: MarginManageAction
  paymentToken?: MarginPaymentToken
  onClose: () => void
}): MarginAdjustControllerResult {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()
  const account = useAccount()
  const { executePlan } = useExecuteMarginPlan()
  const isPlanInFlight = useIsPlanInFlight()
  const { slippageToleranceBps } = useMarginFormStore((s) => ({ slippageToleranceBps: s.slippageToleranceBps }))

  // useMarginQuote's paymentToken param is non-optional even for withdraw/none, so default it
  // here rather than making three modals name a token they never show.
  const paymentToken = useMemo(
    () => paymentTokenInput ?? getMarketDefaultPaymentToken(market),
    [paymentTokenInput, market],
  )

  // The quote no longer carries a max (ceilings are markets metadata now). A manage surface maxes
  // over exactly ONE market: the position is pinned to its venue and can never be re-routed, so the
  // pair's cross-venue max would offer leverage this position's venue cannot serve.
  const { venueCap, cap } = marginLeverageCaps({ market })

  // 1 keeps the delta arithmetic finite for a position with no finite leverage; the modal's own
  // "before" figure comes off the position directly, which reports the real one.
  const knownLeverage = isMarginActivePosition(position) ? positionLeverage(position) : undefined
  const currentLeverage = knownLeverage ?? 1
  // Sending no target holds DEBT constant, which is what "add margin, leave my leverage" means when
  // no leverage can be stated. Two positions cannot state one:
  //  - equity at or below zero has no finite leverage, and a `locked` target of 1 becomes a full
  //    deleverage the backend refuses outright, leaving add-margin no way to succeed;
  //  - leverage drifted above the venue's published ceiling (an adverse move, or a lowered cap): the
  //    venue can no longer honour "hold my leverage", so holding DEBT instead is both the closest
  //    honest reading of the request and the direction that walks leverage back toward the cap.
  //    (The slider does NOT clamp a `locked` readout — it shows the true figure, which is why this
  //    pre-empt is what keeps the request from wiring a leverage the venue has stopped offering.)
  // Read off `venueCap`, never the floored `cap` — a market publishing NO ceiling floors to
  // MIN_LEVERAGE, and treating that as authoritative would degrade every ordinary position to drift.
  // WITHDRAWALS are excluded because the fallback inverts there: holding debt while equity leaves
  // RAISES leverage, so dropping the target would push an over-cap position further over rather than
  // back. A locked withdraw keeps its target and lets the backend refuse it loudly.
  // Compared on the FLOORED value, because that is what the request wires: a position at cap + 0.005
  // floors to exactly the cap, which the venue accepts, so measuring the raw figure would degrade lock
  // to a debt-hold for anything inside (cap, cap + 0.01).
  const isOverVenueCap =
    venueCap !== undefined && knownLeverage !== undefined && Number(floorTo2(knownLeverage)) > venueCap
  // The withdraw carve-out covers the OVER-CAP reason only. Dropping an over-cap target holds debt
  // instead, which on a withdraw RAISES leverage — the opposite of what the drop is for — so a locked
  // withdraw keeps its target and lets the backend refuse it loudly. It cannot cover the no-leverage
  // reason: `currentLeverage` falls back to 1 there, and pinning that wires a full deleverage nothing
  // on the sheet states. A blank wire `leverage` reaches this with positive equity and an armed CTA.
  const isWithdraw = funding.kind === 'withdraw'
  // Named for the one mode it gates: `explicit` carries the user's own target and `drift` sends none,
  // so both pass through unconditionally — only a LOCKED adjust has to pin the current leverage, and
  // only that pin needs a leverage worth stating.
  const canPinLockedTarget = mode.kind !== 'locked' || (knownLeverage !== undefined && (isWithdraw || !isOverVenueCap))
  // One binding, two readers (the target below and the confirm gate further down). Called twice, an
  // argument change at one site would silently desync the leverage the request wires from the gate that
  // decides whether anything changed at all.
  const hasChange = hasAdjustChange({ funding, mode, currentLeverage })
  const targetLeverageX18 =
    hasChange && canPinLockedTarget ? getAdjustTargetLeverageX18({ mode, currentLeverage }) : undefined

  const { quote, quoteError, isQuoteLoading, isDebouncing, isPlaceholderData, debouncedKey } = useMarginQuote({
    position,
    market,
    swapper: account.address,
    action,
    funding,
    paymentToken,
    targetLeverageX18,
    slippageToleranceBps,
  })

  const quoteErrorResult = quoteError ? getMarginQuoteErrorMessage({ error: quoteError, t }) : undefined
  // Fires once per distinct unrecognized code — the dep is the code string itself, so identical
  // re-renders (this can happen many times/sec mid-drag) don't re-log.
  useEffect(() => {
    if (quoteErrorResult?.unrecognizedCode) {
      logger.warn(
        'useMarginAdjustController',
        'useMarginAdjustController',
        `Unrecognized Margin Trading error: ${quoteErrorResult.unrecognizedCode}`,
      )
    }
  }, [quoteErrorResult?.unrecognizedCode])

  const lastGoodQuote = useLastGoodQuote({ quote, isPlaceholderData })
  const displayQuote = quote ?? lastGoodQuote
  const isEditStale = computeIsEditStale({ isDebouncing, isPlaceholderData })
  const dimBeforeAfter = computeIsBeforeAfterDimmed({ isEditStale, hasQuoteError: Boolean(quoteError) })
  const showInitialSkeleton = computeShowInitialSkeleton({
    hasQuote: Boolean(quote),
    hasLastGoodQuote: Boolean(lastGoodQuote),
    isQuoteLoading,
    isDebouncing,
  })

  // "Before" is GONE from the quote (projected-only response) — composed straight off the position
  // instead. Deliberately the un-defaulted read: the position row omits leverage entirely when there
  // is none finite, and anchoring the modal on the 1 fallback would paint a position about to
  // liquidate as unlevered.
  const beforeLeverage = knownLeverage

  // Also gone from the quote — the ACTIVE position row's own ceiling. One binding, two readers.
  const maxWithdrawableRaw = isMarginActivePosition(position) ? position.maxWithdrawable : undefined

  const { spendableBalanceRaw, portfolioLoaded } = useMarginPaymentTokenBalance({
    paymentToken,
    evmAddress: account.address,
  })
  const { overMax, insufficientBalance } = computeFundingRisk({
    funding,
    maxWithdrawableRaw,
    spendableBalanceRaw,
    portfolioLoaded,
  })

  const subId = marginPositionSubId(position)
  const canManage = subId !== undefined && subId !== ''
  const visibleKey = marginQuoteKey({ funding, targetLeverageX18, paymentToken })
  const isVisibleMatchesSubmitted = visibleMatchesSubmitted({ visibleRaw: visibleKey, submittedRaw: debouncedKey })

  const confirmDisabled = getAdjustConfirmDisabled({
    canManage,
    hasAccount: Boolean(account.address),
    hasChange,
    funding,
    hasQuote: Boolean(quote),
    hasQuoteError: Boolean(quoteError),
    isQuoteLoading,
    isPlaceholderData,
    isDebouncing,
    insufficientBalance,
    overMax,
    visibleMatchesSubmitted: isVisibleMatchesSubmitted,
    isPlanInFlight,
  })

  // Gas rides along with the latched quote (displayQuote) so a dimmed stale/errored block doesn't
  // ALSO flip its figure back to a no-quote default.
  const gasDisplay = computeGasDisplay({ gasEstimate: displayQuote?.gasEstimate, formatNumberOrString })

  const onConfirm = useEvent(() => {
    if (confirmDisabled || !account.address || subId === undefined || subId === '') {
      return
    }
    if (!quote) {
      return
    }
    // Re-derive from the CURRENTLY VISIBLE inputs — belt-and-suspenders with the confirmDisabled gate.
    const visibleNow = marginQuoteKey({ funding, targetLeverageX18, paymentToken })
    if (!visibleMatchesSubmitted({ visibleRaw: visibleNow, submittedRaw: debouncedKey })) {
      return
    }
    // The sheet outlives an account switch and marginQuoteKey carries no identity, so
    // visibleMatchesSubmitted cannot catch one — without this, a create could post the new account's
    // swapper against a quote priced for (and holding the positionId of) the previous one. The open
    // flow guards the same operation the same way.
    if (!areEvmAddressesEqual(quote.swapper, account.address)) {
      return
    }
    // Plan create is quote-only now: the quote is posted back verbatim, so nothing here restates it
    // (and so nothing can drift from what the user was actually shown, the old echo check's job).
    const request = buildAdjustCreateRequest({ swapper: account.address, marginQuote: quote })
    void executePlan({ request, action })
    onClose()
  })

  return {
    displayQuote,
    maxWithdrawableRaw,
    equityInRaw: quote?.legs[0]?.bounds.increase?.expectedEquityDelta,
    quoteErrorResult,
    isQuoteLoading,
    isEditStale,
    dimBeforeAfter,
    showInitialSkeleton,
    cap,
    venueCap,
    currentLeverage,
    beforeLeverage,
    spendableBalanceRaw,
    overMax,
    insufficientBalance,
    isPlanInFlight,
    gasDisplay,
    confirmDisabled,
    onConfirm,
    paymentToken,
    slippageToleranceBps,
  }
}
