import type { GasFeeResult } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { memo, useEffect, useState } from 'react'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useGasFeeFormattedDisplayAmounts } from 'uniswap/src/features/gas/hooks'
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
import { ReviewNetworkCostRow } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/ReviewNetworkCostRow'
import { getEVMTxRequest } from 'uniswap/src/features/transactions/swap/utils/routing'
import type { ValidatedTransactionRequest } from 'uniswap/src/features/transactions/types/transactionRequests'
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

  const NetworkCostRowSlot =
    isGasFeeOverridesEnabled && isCustomGasFlowAvailable && enableCustomGasFeeEntry && inputChainId !== undefined ? (
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
      onAcceptTrade={onAcceptTrade}
      onShowWarning={onShowWarning}
    />
  )
})

/**
 * Renders the gas-overrides Network cost row in place of the default
 * `<NetworkFee />`. Extracted as a child so the `useGasFeeFormattedDisplayAmounts`
 * hook can run with a resolved `chainId` (the parent only renders this when
 * `chainId` is defined).
 */
function ReviewNetworkCostRowSlot({
  chainId,
  gasFee,
  tx,
  includesDelegation,
}: {
  chainId: UniverseChainId
  gasFee: GasFeeResult
  tx: ValidatedTransactionRequest | undefined
  includesDelegation?: boolean
}): JSX.Element {
  const { gasFeeFormatted } = useGasFeeFormattedDisplayAmounts({
    gasFee,
    chainId,
    placeholder: '-',
    includesDelegation,
  })
  return <ReviewNetworkCostRow gasFeeUsd={gasFeeFormatted} tx={tx} />
}
