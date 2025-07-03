import { memo, useEffect, useState } from 'react'
import { useTransactionSettingsContext } from 'uniswap/src/features/transactions/components/settings/contexts/TransactionSettingsContext'
import { SwapDetails } from 'uniswap/src/features/transactions/swap/review/SwapDetails/SwapDetails'
import { useSwapReviewCallbacks } from 'uniswap/src/features/transactions/swap/review/contexts/SwapReviewCallbacksContext'
import { useSwapReviewTransactionState } from 'uniswap/src/features/transactions/swap/review/contexts/SwapReviewTransactionContext'
import { useSwapWarningState } from 'uniswap/src/features/transactions/swap/review/contexts/SwapReviewWarningStateContext'

export const SwapReviewSwapDetails = memo(function SwapReviewSwapDetails(): JSX.Element | null {
  const {
    acceptedDerivedSwapInfo,
    derivedSwapInfo,
    feeOnTransferProps,
    tokenWarningProps,
    gasFee,
    newTradeRequiresAcceptance,
    uniswapXGasBreakdown,
    reviewScreenWarning,
    txSimulationErrors,
    swapTxContext,
  } = useSwapReviewTransactionState()
  const { tokenWarningChecked, setTokenWarningChecked } = useSwapWarningState()
  const { onAcceptTrade, onShowWarning } = useSwapReviewCallbacks()
  const { autoSlippageTolerance, customSlippageTolerance } = useTransactionSettingsContext()

  const [stableIncludesDelegation, setStableIncludesDelegation] = useState<boolean | undefined>(
    swapTxContext.includesDelegation,
  )

  useEffect(() => {
    if (swapTxContext.includesDelegation !== undefined) {
      setStableIncludesDelegation(swapTxContext.includesDelegation)
    }
  }, [swapTxContext.includesDelegation])

  if (!derivedSwapInfo || !acceptedDerivedSwapInfo) {
    return null
  }

  return (
    <SwapDetails
      acceptedDerivedSwapInfo={acceptedDerivedSwapInfo}
      autoSlippageTolerance={autoSlippageTolerance}
      customSlippageTolerance={customSlippageTolerance}
      derivedSwapInfo={derivedSwapInfo}
      feeOnTransferProps={feeOnTransferProps}
      tokenWarningProps={tokenWarningProps}
      tokenWarningChecked={tokenWarningChecked}
      setTokenWarningChecked={setTokenWarningChecked}
      gasFee={gasFee}
      newTradeRequiresAcceptance={newTradeRequiresAcceptance}
      uniswapXGasBreakdown={uniswapXGasBreakdown}
      warning={reviewScreenWarning?.warning}
      txSimulationErrors={txSimulationErrors}
      includesDelegation={stableIncludesDelegation}
      onAcceptTrade={onAcceptTrade}
      onShowWarning={onShowWarning}
    />
  )
})
