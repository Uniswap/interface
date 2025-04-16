import { createContext, useContext } from 'react'
import { Warning, WarningWithStyle } from 'uniswap/src/components/modals/WarningModal/types'
import { TransactionFailureReason } from 'uniswap/src/data/tradingApi/__generated__/index'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import {
  FeeOnTransferFeeGroupProps,
  TokenWarningProps,
} from 'uniswap/src/features/transactions/TransactionDetails/types'
import { useSwapTxContext } from 'uniswap/src/features/transactions/swap/contexts/SwapTxContext'
import { useSwapReviewCallbacks } from 'uniswap/src/features/transactions/swap/review/contexts/SwapReviewCallbacksContext'
import { useSwapReviewState } from 'uniswap/src/features/transactions/swap/review/contexts/SwapReviewStateContext'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { UniswapXGasBreakdown } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { IndicativeTrade, Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { CurrencyField } from 'uniswap/src/types/currency'

export interface SwapReviewTransactionContextState {
  trade: Trade | undefined
  indicativeTrade: IndicativeTrade | undefined
  acceptedTrade: Trade | undefined
  swapTxContext: ReturnType<typeof useSwapTxContext>
  gasFee: GasFeeResult
  uniswapXGasBreakdown: UniswapXGasBreakdown | undefined
  derivedSwapInfo: DerivedSwapInfo | undefined
  acceptedDerivedSwapInfo: DerivedSwapInfo | undefined
  isWrap: boolean
  blockingWarning: Warning | undefined
  reviewScreenWarning: WarningWithStyle | undefined
  txSimulationErrors: TransactionFailureReason[] | undefined
  newTradeRequiresAcceptance: boolean
  feeOnTransferProps: FeeOnTransferFeeGroupProps | undefined
  tokenWarningProps: TokenWarningProps
  currencyInInfo: Maybe<CurrencyInfo>
  currencyOutInfo: Maybe<CurrencyInfo>
  chainId: UniverseChainId
}

export const SwapReviewTransactionContext = createContext<SwapReviewTransactionContextState>(
  null as unknown as SwapReviewTransactionContextState,
)

export const useSwapReviewTransactionState = (): SwapReviewTransactionContextState => {
  const context = useContext(SwapReviewTransactionContext)
  if (!context) {
    throw new Error('useSwapReview must be used within a SwapReviewContextProvider')
  }
  return context
}

export function useIsSwapReviewLoading(): boolean {
  const { derivedSwapInfo, acceptedDerivedSwapInfo, isWrap, indicativeTrade, acceptedTrade, trade } =
    useSwapReviewTransactionState()
  // A missing `acceptedTrade` or `trade` can happen when the user leaves the app and comes back to the review screen after 1 minute when the TTL for the quote has expired.
  // When that happens, we remove the quote from the cache before refetching, so there's no `trade`.
  return !derivedSwapInfo || !acceptedDerivedSwapInfo || (!isWrap && !indicativeTrade && (!acceptedTrade || !trade))
}

export function useIsSwapMissingParams(): boolean {
  const { currencyInInfo, currencyOutInfo, acceptedDerivedSwapInfo, derivedSwapInfo } = useSwapReviewTransactionState()
  return (
    !currencyInInfo ||
    !currencyOutInfo ||
    !derivedSwapInfo?.currencyAmounts[CurrencyField.INPUT] ||
    !derivedSwapInfo?.currencyAmounts[CurrencyField.OUTPUT] ||
    !acceptedDerivedSwapInfo?.currencyAmounts[CurrencyField.INPUT] ||
    !acceptedDerivedSwapInfo?.currencyAmounts[CurrencyField.OUTPUT]
  )
}

export function useSwapReviewError(): {
  submissionError: Error | undefined
  setSubmissionError: (error?: Error) => void
  onSwapButtonClick: () => Promise<void>
} {
  const { onSwapButtonClick } = useSwapReviewCallbacks()
  const { submissionError, setSubmissionError } = useSwapReviewState()
  return {
    submissionError,
    setSubmissionError,
    onSwapButtonClick,
  }
}
