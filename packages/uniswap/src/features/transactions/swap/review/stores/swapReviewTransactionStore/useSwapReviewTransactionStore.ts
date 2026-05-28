import { useContext } from 'react'
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
  // A missing `acceptedTrade` or `trade` can happen when the user leaves the app and comes back to the review screen after 1 minute when the TTL for the quote has expired.
  // When that happens, we remove the quote from the cache before refetching, so there's no `trade`.
  return useSwapReviewTransactionStore(
    (s) => !s.acceptedDerivedSwapInfo || (!s.isWrap && !s.indicativeTrade && (!s.acceptedTrade || !s.trade)),
  )
}

export function useIsSwapMissingParams(): boolean {
  return useSwapReviewTransactionStore(
    (s) =>
      !s.currencyInInfo ||
      !s.currencyOutInfo ||
      !s.derivedSwapInfo.currencyAmounts[CurrencyField.INPUT] ||
      !s.derivedSwapInfo.currencyAmounts[CurrencyField.OUTPUT] ||
      !s.acceptedDerivedSwapInfo?.currencyAmounts[CurrencyField.INPUT] ||
      !s.acceptedDerivedSwapInfo.currencyAmounts[CurrencyField.OUTPUT],
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
