import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { memo, useEffect, useState } from 'react'
import { useEnableCustomGasFeeEntry } from 'uniswap/src/features/gas/hooks/useEnableCustomGasFeeEntry'
import { useIsCustomGasFlowAvailable } from 'uniswap/src/features/gas/hooks/useIsCustomGasFlowAvailable'
import {
  useTransactionSettingsAutoSlippageToleranceStore,
  useTransactionSettingsStore,
} from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore'
import { useSwapReviewCallbacksStore } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewCallbacksStore/useSwapReviewCallbacksStore'
import { useSwapReviewTransactionStore } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewTransactionStore/useSwapReviewTransactionStore'
import {
  useSwapReviewWarningStateActions,
  useSwapReviewWarningStore,
} from 'uniswap/src/features/transactions/swap/review/stores/swapReviewWarningStore/useSwapReviewWarningStore'
import { SwapDetails } from 'uniswap/src/features/transactions/swap/review/SwapDetails/SwapDetails'
import { resolveSponsorshipInfo } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/resolveSponsorshipInfo'
import { ReviewNetworkCostRowSlot } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/ReviewNetworkCostRowSlot'
import { getEVMTxRequest } from 'uniswap/src/features/transactions/swap/utils/routing'
import { CurrencyField } from 'uniswap/src/types/currency'

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
    onAcceptTrade,
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
    onAcceptTrade: s.onAcceptTrade,
  }))
  const tokenWarningChecked = useSwapReviewWarningStore((s) => s.tokenWarningChecked)
  const { setTokenWarningChecked } = useSwapReviewWarningStateActions()
  const onShowWarning = useSwapReviewCallbacksStore((s) => s.onShowWarning)
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

  const isGasFeeOverridesEnabled = useFeatureFlag(FeatureFlags.GasFeeOverrides)
  const enableCustomGasFeeEntry = useEnableCustomGasFeeEntry()
  const isCustomGasFlowAvailable = useIsCustomGasFlowAvailable()

  if (!acceptedDerivedSwapInfo) {
    return null
  }

  const inputChainId = acceptedDerivedSwapInfo.currencyAmounts[CurrencyField.INPUT]?.currency.chainId

  // Pull the primary EVM tx from the swapTxContext for the warning-state
  // derivation. Returns undefined for UniswapX / Jupiter, which is what we
  // want — those routings have no editable EVM gas.
  const txRequest = getEVMTxRequest(swapTxContext)
  const sponsorshipInfo = resolveSponsorshipInfo(swapTxContext)
  const sponsorMetadata = sponsorshipInfo?.sponsorMetadata

  const NetworkCostRowSlot =
    !sponsorMetadata &&
    isGasFeeOverridesEnabled &&
    isCustomGasFlowAvailable &&
    enableCustomGasFeeEntry &&
    inputChainId !== undefined ? (
      <ReviewNetworkCostRowSlot
        chainId={inputChainId}
        gasFee={gasFee}
        tx={txRequest}
        includesDelegation={stableIncludesDelegation}
      />
    ) : undefined

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
      NetworkCostRowSlot={NetworkCostRowSlot}
      sponsorshipInfo={sponsorshipInfo}
      onAcceptTrade={onAcceptTrade}
      onShowWarning={onShowWarning}
    />
  )
})
