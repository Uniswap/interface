import { memo, useEffect, useState } from 'react'
import {
  useTransactionSettingsAutoSlippageToleranceStore,
  useTransactionSettingsStore,
} from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore'
import { SwapDetails } from 'uniswap/src/features/transactions/swap/review/SwapDetails/SwapDetails'
import { useSwapReviewCallbacksStore } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewCallbacksStore/useSwapReviewCallbacksStore'
import { useSwapReviewTransactionStore } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewTransactionStore/useSwapReviewTransactionStore'
import {
  useSwapReviewWarningStateActions,
  useSwapReviewWarningStore,
} from 'uniswap/src/features/transactions/swap/review/stores/swapReviewWarningStore/useSwapReviewWarningStore'

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
  } = useSwapReviewTransactionStore((s) => ({
    acceptedDerivedSwapInfo: s.acceptedDerivedSwapInfo,
    derivedSwapInfo: s.derivedSwapInfo,
    feeOnTransferProps: s.feeOnTransferProps,
    tokenWarningProps: s.tokenWarningProps,
    gasFee: s.gasFee,
    newTradeRequiresAcceptance: s.newTradeRequiresAcceptance,
    uniswapXGasBreakdown: s.uniswapXGasBreakdown,
    reviewScreenWarning: s.reviewScreenWarning,
    txSimulationErrors: s.txSimulationErrors,
    swapTxContext: s.swapTxContext,
  }))
  const tokenWarningChecked = useSwapReviewWarningStore((s) => s.tokenWarningChecked)
  const { setTokenWarningChecked } = useSwapReviewWarningStateActions()
  const { onAcceptTrade, onShowWarning } = useSwapReviewCallbacksStore((s) => ({
    onAcceptTrade: s.onAcceptTrade,
    onShowWarning: s.onShowWarning,
  }))
  const customSlippageTolerance = useTransactionSettingsStore((s) => s.customSlippageTolerance)
  const autoSlippageTolerance = useTransactionSettingsAutoSlippageToleranceStore((s) => s.autoSlippageTolerance)

  const [stableIncludesDelegation, setStableIncludesDelegation] = useState<boolean | undefined>(
    swapTxContext.includesDelegation,
  )

  useEffect(() => {
    if (swapTxContext.includesDelegation !== undefined) {
      setStableIncludesDelegation(swapTxContext.includesDelegation)
    }
  }, [swapTxContext.includesDelegation])

  if (!acceptedDerivedSwapInfo) {
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
