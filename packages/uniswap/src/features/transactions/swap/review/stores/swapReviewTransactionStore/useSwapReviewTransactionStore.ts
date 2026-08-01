import { useContext } from 'react'
import { useIsEarnEnabled } from 'uniswap/src/features/earn/hooks/useIsEarnEnabled'
import { useSwapReviewCallbacksStore } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewCallbacksStore/useSwapReviewCallbacksStore'
import {
  useSwapReviewActions,
  useSwapReviewStore,
} from 'uniswap/src/features/transactions/swap/review/stores/swapReviewStore/useSwapReviewStore'
import type {
  SwapReviewTransactionState,
  SwapReviewTransactionStore,
} from 'uniswap/src/features/transactions/swap/review/stores/swapReviewTransactionStore/createSwapReviewTransactionStore'
import { SwapReviewTransactionStoreContext } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewTransactionStore/SwapReviewTransactionStoreContext'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import type { Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { isChained } from 'uniswap/src/features/transactions/swap/utils/routing'
import { CurrencyField } from 'uniswap/src/types/currency'
import { useStore } from 'zustand'
import { useShallow } from 'zustand/shallow'

const useSwapReviewTransactionStoreBase = (): SwapReviewTransactionStore => {
  const store = useContext(SwapReviewTransactionStoreContext)

  if (!store) {
    throw new Error('useSwapReviewTransactionStore must be used within SwapReviewTransactionStoreContextProvider')
  }

  return store
}

export function useSwapReviewTransactionStore<T>(selector: (state: SwapReviewTransactionState) => T): T {
  const store = useSwapReviewTransactionStoreBase()

  return useStore(store, useShallow(selector))
}

export function useIsSwapReviewLoading(): boolean {
  const isEarnQuoteRefreshLoading = useIsEarnQuoteRefreshLoading()
  const isEarnEnabled = useIsEarnEnabled()
  const isEarnFlow = useSwapFormStore((s) => s.isEarnFlow === true)

  // A missing `acceptedTrade` or `trade` can happen when the user leaves the app and comes back to the review screen after 1 minute when the TTL for the quote has expired.
  // When that happens, we remove the quote from the cache before refetching, so there's no `trade`.
  return useSwapReviewTransactionStore((s) => {
    // Earn quote refreshes (e.g. toggling the deposit) can settle into an error; treat a settled
    // error as "not loading" so the error surfaces instead of an infinite spinner. Non-earn swaps
    // keep the original behavior: a missing `trade` while an `acceptedTrade` exists means loading.
    const isEarnContext = isEarnEnabled && (isEarnFlow || isEarnTrade(s.acceptedTrade))
    const isTradeMissing = isEarnContext ? !s.trade && !s.derivedSwapInfo.trade.error : !s.trade

    return (
      !s.acceptedDerivedSwapInfo ||
      (!isEarnQuoteRefreshLoading && !s.isWrap && !s.indicativeTrade && (!s.acceptedTrade || isTradeMissing))
    )
  })
}

export function useIsEarnQuoteRefreshLoading(): boolean {
  const isEarnFlow = useSwapFormStore((s) => s.isEarnFlow === true)

  return useSwapReviewTransactionStore((s) => getIsEarnQuoteRefreshLoading({ state: s, isEarnFlow }))
}

export function useEarnQuoteRefreshField(): CurrencyField | undefined {
  const isEarnQuoteRefreshLoading = useIsEarnQuoteRefreshLoading()

  return useSwapReviewTransactionStore((s) => {
    if (!isEarnQuoteRefreshLoading || !s.acceptedDerivedSwapInfo) {
      return undefined
    }

    return s.acceptedDerivedSwapInfo.exactCurrencyField === CurrencyField.INPUT
      ? CurrencyField.OUTPUT
      : CurrencyField.INPUT
  })
}

export function getIsEarnQuoteRefreshLoading({
  state,
  isEarnFlow,
}: {
  state: SwapReviewTransactionState
  isEarnFlow: boolean
}): boolean {
  const acceptedTradeIsEarn = isEarnTrade(state.acceptedTrade)
  const isRefreshingEarnToggle = isEarnFlow || acceptedTradeIsEarn

  return (
    isRefreshingEarnToggle &&
    !state.isWrap &&
    !!state.acceptedDerivedSwapInfo &&
    !!state.acceptedTrade &&
    !state.trade &&
    (state.derivedSwapInfo.trade.isLoading || state.derivedSwapInfo.trade.isFetching === true)
  )
}

function isEarnTrade(trade: Trade | undefined): boolean {
  return !!trade && isChained(trade) && !!trade.earnIntent
}

export function useIsSwapMissingParams(): boolean {
  const isEarnQuoteRefreshLoading = useIsEarnQuoteRefreshLoading()

  return useSwapReviewTransactionStore((s) => getIsSwapMissingParams({ state: s, isEarnQuoteRefreshLoading }))
}

export function getIsSwapMissingParams({
  state,
  isEarnQuoteRefreshLoading,
}: {
  state: SwapReviewTransactionState
  isEarnQuoteRefreshLoading: boolean
}): boolean {
  const hasAcceptedAmounts = hasSwapCurrencyAmounts(state.acceptedDerivedSwapInfo)
  const shouldUseAcceptedAmounts = getHasSettledEarnQuoteRefreshError(state)

  return (
    !state.currencyInInfo ||
    !state.currencyOutInfo ||
    (!isEarnQuoteRefreshLoading && !shouldUseAcceptedAmounts && !hasSwapCurrencyAmounts(state.derivedSwapInfo)) ||
    !hasAcceptedAmounts
  )
}

/**
 * True when an earn quote refresh has settled into an error while an accepted earn trade is still on
 * screen. The review keeps rendering the accepted trade's details in this state and surfaces a retry
 * affordance — it must neither stall on a loader nor render `SwapDetails` against the missing live trade.
 */
export function useHasSettledEarnQuoteRefreshError(): boolean {
  return useSwapReviewTransactionStore(getHasSettledEarnQuoteRefreshError)
}

export function getHasSettledEarnQuoteRefreshError(state: SwapReviewTransactionState): boolean {
  return (
    isEarnTrade(state.acceptedTrade) &&
    !state.trade &&
    !!state.derivedSwapInfo.trade.error &&
    !state.derivedSwapInfo.trade.isLoading &&
    state.derivedSwapInfo.trade.isFetching !== true &&
    hasSwapCurrencyAmounts(state.acceptedDerivedSwapInfo)
  )
}

function hasSwapCurrencyAmounts(derivedSwapInfo: SwapReviewTransactionState['derivedSwapInfo'] | undefined): boolean {
  return Boolean(
    derivedSwapInfo?.currencyAmounts[CurrencyField.INPUT] && derivedSwapInfo.currencyAmounts[CurrencyField.OUTPUT],
  )
}

export function useSwapReviewError(): {
  submissionError: Error | undefined
  setSubmissionError: (error?: Error) => void
  onSwapButtonClick: () => Promise<void>
  onPressRetry: (() => void) | undefined
} {
  const onSwapButtonClick = useSwapReviewCallbacksStore((s) => s.onSwapButtonClick)
  const { submissionError, onPressRetry } = useSwapReviewStore((s) => ({
    submissionError: s.submissionError,
    onPressRetry: s.onPressRetry,
  }))

  const { setSubmissionError } = useSwapReviewActions()

  return {
    submissionError,
    setSubmissionError,
    onSwapButtonClick,
    onPressRetry,
  }
}
