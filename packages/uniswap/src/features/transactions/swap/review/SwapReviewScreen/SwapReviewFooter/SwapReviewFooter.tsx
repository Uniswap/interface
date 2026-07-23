import { isWebApp, isWebPlatform } from '@universe/environment'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, IconButton, Text, useIsShortMobileDevice } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { BackArrow } from 'ui/src/components/icons/BackArrow'
import type { Warning } from 'uniswap/src/components/modals/WarningModal/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useGasOverridesWarningState } from 'uniswap/src/features/gas/components/NetworkCostEditor/useGasOverridesWarningState'
import { useIsCustomGasFlowAvailable } from 'uniswap/src/features/gas/hooks/useIsCustomGasFlowAvailable'
import {
  useTransactionSettingsActions,
  useTransactionSettingsStore,
} from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore'
import { TransactionModalFooterContainer } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModal'
import { useSwapOnPrevious } from 'uniswap/src/features/transactions/swap/review/hooks/useSwapOnPrevious'
import { activePlanStore } from 'uniswap/src/features/transactions/swap/review/stores/activePlan/activePlanStore'
import { useSwapReviewCallbacksStore } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewCallbacksStore/useSwapReviewCallbacksStore'
import { useShowInterfaceReviewSteps } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewStore/useSwapReviewStore'
import {
  useIsEarnQuoteRefreshLoading,
  useSwapReviewTransactionStore,
} from 'uniswap/src/features/transactions/swap/review/stores/swapReviewTransactionStore/useSwapReviewTransactionStore'
import { useSwapReviewWarningStore } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewWarningStore/useSwapReviewWarningStore'
import { EarnSwapToggle } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/EarnSwapToggle'
import { SubmitSwapButton } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/SwapReviewFooter/SubmitSwapButton'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { isValidSwapTxContext } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { getEVMTxRequest, isChained } from 'uniswap/src/features/transactions/swap/utils/routing'
import { UnichainPoweredMessage } from 'uniswap/src/features/transactions/TransactionDetails/UnichainPoweredMessage'
import { getShouldDisplayTokenWarningCard } from 'uniswap/src/features/transactions/TransactionDetails/utils/getShouldDisplayTokenWarningCard'
import { SagaStatus, useMonitoredSagaStatus } from 'uniswap/src/utils/saga'
import { useEvent } from 'utilities/src/react/hooks'
import { useStore } from 'zustand'

export const SwapReviewFooter = memo(function SwapReviewFooter(): JSX.Element | null {
  const { t } = useTranslation()
  const showInterfaceReviewSteps = useShowInterfaceReviewSteps()
  const { onPrev } = useSwapOnPrevious()
  const { disabled, showPendingUI, warning, onSubmit, isSubmitting, isSwapOrPlanSagaRunning } = useSwapSubmitButton()
  const isShortMobileDevice = useIsShortMobileDevice()
  const showUnichainPoweredMessage = useSwapReviewTransactionStore((s) => {
    const isUnichain = s.chainId && [UniverseChainId.Unichain, UniverseChainId.UnichainSepolia].includes(s.chainId)
    if (!isUnichain) {
      return false
    }
    const routing = s.derivedSwapInfo.trade.trade?.routing
    return routing !== undefined && !isChained({ routing })
  })

  const hasActivePlan = useStore(activePlanStore, (state) => !!state.activePlan)
  const allowRetryPlan = hasActivePlan && !isSubmitting
  const showEarnSwapToggle = (isWebApp || !isWebPlatform) && !showInterfaceReviewSteps && !hasActivePlan

  // Mirror the same warning derivation that drives the Network cost row, so
  // the submit button and the row stay in sync when the user has saved a risky
  // override (e.g. priority fee too low).
  const isGasFeeOverridesEnabled = useFeatureFlag(FeatureFlags.GasFeeOverrides)
  const isCustomGasFlowAvailable = useIsCustomGasFlowAvailable()
  const swapTxContext = useSwapReviewTransactionStore((s) => s.swapTxContext)
  const txRequest = getEVMTxRequest(swapTxContext)
  const swapGasOverrides = useTransactionSettingsStore((s) => s.gasOverrides)
  const { setGasOverrides } = useTransactionSettingsActions()
  const { hasWarning: gasOverrideHasWarning } = useGasOverridesWarningState({
    tx: txRequest,
    gasOverrides: swapGasOverrides,
  })
  const showGasOverrideWarning = isGasFeeOverridesEnabled && isCustomGasFlowAvailable && gasOverrideHasWarning

  // Reset clears the saved override and navigates back to the form so the next
  // /swap quote (without urgency overrides) is in hand before the user can
  // submit. Without the navigation, a user could tap Reset → Swap fast enough
  // to submit the still-baked-with-low-gas tx that has not yet been replaced.
  // Mirrors `useFormGasOverridesController.onResetOverrides`.
  const onResetGasOverrides = useEvent((): void => {
    setGasOverrides(undefined)
    onPrev()
  })

  if (showInterfaceReviewSteps && !allowRetryPlan) {
    return null
  }

  return (
    <TransactionModalFooterContainer>
      {showUnichainPoweredMessage && <UnichainPoweredMessage />}
      {isSwapOrPlanSagaRunning && !isSubmitting && (
        <Text variant="body4" color="$statusCritical" textAlign="center" pb="$spacing12">
          {t('swap.review.pendingWalletAction')}
        </Text>
      )}
      {showGasOverrideWarning && (
        <Flex
          row
          alignItems="flex-start"
          backgroundColor="$statusWarning2"
          borderRadius="$rounded12"
          gap="$spacing8"
          mb="$spacing12"
          p="$spacing12"
        >
          <AlertTriangleFilled color="$statusWarning" size="$icon.20" />
          <Flex shrink fill>
            <Text variant="body3" color="$statusWarning" fontWeight="$medium">
              {t('gas.override.swapMayFail.title')}
            </Text>
            <Text variant="body3" color="$neutral2">
              {t('gas.override.swapMayFail.body')}{' '}
              <Text
                variant="body3"
                color="$neutral1"
                textDecorationLine="underline"
                cursor="pointer"
                onPress={onResetGasOverrides}
              >
                {t('common.button.reset')}
              </Text>
            </Text>
          </Flex>
        </Flex>
      )}
      {showEarnSwapToggle && <EarnSwapToggle />}
      <Flex row gap="$spacing8">
        {!isWebPlatform && !showPendingUI && (
          <IconButton
            icon={<BackArrow />}
            emphasis="secondary"
            size={isShortMobileDevice ? 'medium' : 'large'}
            onPress={onPrev}
          />
        )}
        <SubmitSwapButton
          disabled={disabled}
          showPendingUI={showPendingUI}
          warning={warning}
          gasOverrideWarning={showGasOverrideWarning}
          onSubmit={onSubmit}
        />
      </Flex>
    </TransactionModalFooterContainer>
  )
})

function useSwapSubmitButton(): {
  disabled: boolean
  showPendingUI: boolean
  warning: Warning | undefined
  onSubmit: () => Promise<void>
  isSubmitting: boolean
  isSwapOrPlanSagaRunning: boolean
} {
  const {
    tokenWarningProps,
    feeOnTransferProps,
    blockingWarning,
    newTradeRequiresAcceptance,
    reviewScreenWarning,
    swapTxContext,
    isWrap,
  } = useSwapReviewTransactionStore((s) => ({
    tokenWarningProps: s.tokenWarningProps,
    feeOnTransferProps: s.feeOnTransferProps,
    blockingWarning: s.blockingWarning,
    newTradeRequiresAcceptance: s.newTradeRequiresAcceptance,
    reviewScreenWarning: s.reviewScreenWarning,
    swapTxContext: s.swapTxContext,
    isWrap: s.isWrap,
  }))

  const tokenWarningChecked = useSwapReviewWarningStore((s) => s.tokenWarningChecked)
  const isEarnQuoteRefreshLoading = useIsEarnQuoteRefreshLoading()
  const { isSubmitting, showPendingUI } = useSwapFormStore((s) => ({
    isSubmitting: s.isSubmitting,
    showPendingUI: s.showPendingUI,
  }))
  const onSwapButtonClick = useSwapReviewCallbacksStore((s) => s.onSwapButtonClick)
  const { shouldDisplayTokenWarningCard } = getShouldDisplayTokenWarningCard({
    tokenWarningProps,
    feeOnTransferProps,
  })

  // Check if swap or plan saga is currently running
  const swapSagaState = useMonitoredSagaStatus('swapSaga')
  const planSagaState = useMonitoredSagaStatus('planSaga')
  const isSwapOrPlanSagaRunning =
    swapSagaState.status === SagaStatus.Started || planSagaState.status === SagaStatus.Started

  const submitButtonDisabled = useMemo(() => {
    const validSwap = isValidSwapTxContext(swapTxContext)
    const isTokenWarningBlocking = shouldDisplayTokenWarningCard && !tokenWarningChecked

    return (
      (!validSwap && !isWrap) ||
      !!blockingWarning ||
      newTradeRequiresAcceptance ||
      isSubmitting ||
      isEarnQuoteRefreshLoading ||
      isTokenWarningBlocking ||
      isSwapOrPlanSagaRunning
    )
  }, [
    swapTxContext,
    isWrap,
    blockingWarning,
    newTradeRequiresAcceptance,
    isSubmitting,
    isEarnQuoteRefreshLoading,
    tokenWarningChecked,
    shouldDisplayTokenWarningCard,
    isSwapOrPlanSagaRunning,
  ])

  return {
    disabled: submitButtonDisabled,
    showPendingUI,
    onSubmit: onSwapButtonClick,
    warning: reviewScreenWarning?.warning,
    isSubmitting,
    isSwapOrPlanSagaRunning,
  }
}
