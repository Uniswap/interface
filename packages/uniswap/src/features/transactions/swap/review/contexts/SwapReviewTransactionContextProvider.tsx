import { ReactNode, useMemo } from 'react'
import { getRelevantTokenWarningSeverity } from 'uniswap/src/features/transactions/TransactionDetails/utils/getRelevantTokenWarningSeverity'
import { useFeeOnTransferAmounts } from 'uniswap/src/features/transactions/swap/hooks/useFeeOnTransferAmount'
import { useParsedSwapWarnings } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings'
import {
  SwapReviewTransactionContext,
  SwapReviewTransactionContextState,
} from 'uniswap/src/features/transactions/swap/review/contexts/SwapReviewTransactionContext'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { SwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { isClassic, isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { isWrapAction } from 'uniswap/src/features/transactions/swap/utils/wrap'
import { CurrencyField } from 'uniswap/src/types/currency'

export interface SwapReviewContextProviderProps {
  children: ReactNode
  derivedSwapInfo: DerivedSwapInfo
  swapTxContext: SwapTxAndGasInfo
  swapAcceptedDerivedSwapInfo?: DerivedSwapInfo
  newTradeRequiresAcceptance: boolean
}

export function SwapReviewTransactionContextProvider({
  children,
  derivedSwapInfo,
  swapTxContext,
  swapAcceptedDerivedSwapInfo,
  newTradeRequiresAcceptance,
}: SwapReviewContextProviderProps): JSX.Element {
  const uniswapXGasBreakdown = isUniswapX(swapTxContext) ? swapTxContext.gasFeeBreakdown : undefined

  const {
    chainId,
    currencies,
    wrapType,
    trade: { trade, indicativeTrade }, // TODO(WEB-5823): rm indicative trade usage from review screen
  } = derivedSwapInfo

  const { blockingWarning, reviewScreenWarning } = useParsedSwapWarnings()
  const isWrap = isWrapAction(wrapType)
  const acceptedDerivedSwapInfo = isWrap ? derivedSwapInfo : swapAcceptedDerivedSwapInfo
  const acceptedTrade = acceptedDerivedSwapInfo?.trade.trade
  const feeOnTransferProps = useFeeOnTransferAmounts(acceptedDerivedSwapInfo)
  const tokenWarningProps = getRelevantTokenWarningSeverity(acceptedDerivedSwapInfo)

  const txSimulationErrors = useMemo(() => {
    if (!trade || !isClassic(trade)) {
      return undefined
    }
    return trade.quote?.quote.txFailureReasons
  }, [trade])

  // Pack up all the values and callbacks into the context value
  const contextValue: SwapReviewTransactionContextState = {
    // State
    trade: trade ?? undefined,
    indicativeTrade: indicativeTrade ?? undefined,
    acceptedTrade: acceptedTrade ?? undefined,
    swapTxContext,
    gasFee: swapTxContext.gasFee,
    uniswapXGasBreakdown,
    derivedSwapInfo,
    acceptedDerivedSwapInfo,
    isWrap,
    blockingWarning,
    reviewScreenWarning,
    txSimulationErrors,
    newTradeRequiresAcceptance,
    feeOnTransferProps,
    tokenWarningProps,
    currencyInInfo: currencies[CurrencyField.INPUT],
    currencyOutInfo: currencies[CurrencyField.OUTPUT],
    chainId,
  }

  return <SwapReviewTransactionContext.Provider value={contextValue}>{children}</SwapReviewTransactionContext.Provider>
}
