import { Flex } from '@universe/mycelium'
import { useTranslation } from 'react-i18next'
import { Button } from 'ui/src'
import type {
  MarginCreatePlanRequest,
  MarginQuoteResponse,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { useEvent } from 'utilities/src/react/hooks'
import { useAccountDrawer } from '~/components/AccountDrawer/MiniPortfolio/hooks'
import { MARGIN_CHAIN_ID } from '~/constants/margin'
import { useAccount } from '~/hooks/useAccount'
import { MarginVenueEmptyNotice } from '~/pages/Swap/Margin/components/MarginVenuePreferences'
import { decideOpenAction } from '~/pages/Swap/Margin/hooks/marginExecutionGuards'
import { marginPlanExecutionStore, useMarginPlanExecution } from '~/pages/Swap/Margin/hooks/marginPlanExecutionStore'
import type { DerivedMarginInfo } from '~/pages/Swap/Margin/hooks/useDerivedMarginInfo'
import { useExecuteMarginPlan } from '~/pages/Swap/Margin/hooks/useExecuteMarginPlan'
import {
  isMarginOpenLoading,
  isUnroutablePaymentTokenError,
  MIN_LEVERAGE,
} from '~/pages/Swap/Margin/marginOpenButtonGate'

export function buildOpenPlanRequest({
  derivedMarginInfo,
  swapper,
  quote,
}: {
  derivedMarginInfo: DerivedMarginInfo
  swapper: string
  // The exact quote the user reviewed — the review modal's PINNED copy, passed explicitly with no
  // default. A default to the form's live quote would fail OPEN: a poll that re-routed to another
  // venue could then become what gets created, which the pin exists to prevent.
  quote: MarginQuoteResponse | undefined
}): MarginCreatePlanRequest | undefined {
  const { paymentAmountRaw } = derivedMarginInfo
  if (!quote || !paymentAmountRaw) {
    return undefined
  }
  // Every non-RECOVER create posts the quote verbatim — no restated fields, no echo to build.
  return { chainId: MARGIN_CHAIN_ID, swapper, marginQuote: quote }
}

export function MarginOpenButton({
  derivedMarginInfo,
  onRequestReview,
}: {
  derivedMarginInfo: DerivedMarginInfo
  onRequestReview: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const account = useAccount()
  const accountDrawer = useAccountDrawer()
  const { resumePlan } = useExecuteMarginPlan()

  const {
    direction,
    market,
    hasEnteredAmount,
    hasSufficientBalance,
    quote,
    quoteError,
    isQuoteLoading,
    isFetching,
    isPlaceholderData,
    isDebouncing,
    paymentCurrency,
    paymentToken,
    leverage,
    maxLeverage,
    allowedVenues,
  } = derivedMarginInfo

  const onOpen = useEvent(() => {
    // Form is truth: the CTA opens what the form shows. Only re-focus an OPEN the executor still
    // holds in memory; a plan held under a foreign intent blocks. A stranded plan from a prior
    // session is NOT resumed here — it surfaces as the pending-plan card (Cancel) plus the
    // persisted-pointer banner, which carries the Resume.
    const existing = marginPlanExecutionStore.getState().plan
    const action = decideOpenAction({ existing })
    if (action.kind === 'resume') {
      void resumePlan({ planId: action.planId })
      return
    }
    if (action.kind === 'block') {
      return
    }
    // create → open the review modal; no plan is minted until confirm.
    onRequestReview()
  })

  // Subscribed at render, not just read in the handler: a blocked action has to reach the label, or
  // the CTA stays enabled and swallows the press with nothing said.
  const existingPlan = useMarginPlanExecution((state) => state.plan)

  if (!account.address) {
    return (
      <Flex row>
        <Button variant="branded" size="large" fill onPress={accountDrawer.open}>
          {t('common.connectWallet.button')}
        </Button>
      </Flex>
    )
  }

  const cap = Math.max(maxLeverage ?? MIN_LEVERAGE, MIN_LEVERAGE)
  const loading = isMarginOpenLoading({ isQuoteLoading, isDebouncing, isFetching, isPlaceholderData })
  const openAction = decideOpenAction({ existing: existingPlan })

  let label = direction === 'SHORT' ? t('margin.cta.reviewShort') : t('margin.cta.reviewLong')
  let disabled = false
  // A plan of another intent still holds the executor: the positions-table banner owns resuming it,
  // and nothing on this form can clear it.
  if (openAction.kind === 'block') {
    label = t('margin.error.planInFlight')
    disabled = true
    // Excluding every venue this pair offers leaves no allowlist to quote against, so there is no
    // request in flight to report on and nothing the amount or leverage could fix.
  } else if (allowedVenues.length === 0) {
    label = t('margin.venues.emptyCta')
    disabled = true
  } else if (!hasEnteredAmount) {
    label = t('margin.cta.enterAmount')
    disabled = true
  } else if (leverage < MIN_LEVERAGE) {
    label = t('margin.cta.leverageTooLow')
    disabled = true
  } else if (leverage > cap) {
    label = t('margin.cta.overCap')
    disabled = true
  } else if (!hasSufficientBalance) {
    label = t('margin.error.insufficientBalance', { symbol: paymentCurrency.symbol ?? '' })
    disabled = true
  } else if (loading) {
    disabled = true
  } else if (isUnroutablePaymentTokenError(quoteError)) {
    label = t('margin.cta.unroutable', { symbol: paymentToken.symbol, collateral: market.displaySymbol })
    disabled = true
  } else if (quoteError) {
    label = t('margin.error.quoteFailed')
    disabled = true
  } else if (!quote) {
    disabled = true
  }

  return (
    <>
      {/* Sibling of the CTA, not a replacement for it: the button still says what is wrong, and the
          notice carries the sentence plus the way back into the opt-out sheet. */}
      {allowedVenues.length === 0 ? <MarginVenueEmptyNotice /> : null}
      <Flex row>
        <Button variant="branded" size="large" fill loading={loading} disabled={disabled || loading} onPress={onOpen}>
          {label}
        </Button>
      </Flex>
    </>
  )
}
