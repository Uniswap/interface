import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, IconButton, Text, useIsShortMobileDevice } from 'ui/src'
import { BackArrow } from 'ui/src/components/icons/BackArrow'
import type { Warning } from 'uniswap/src/components/modals/WarningModal/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TransactionModalFooterContainer } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModal'
import { useSwapOnPrevious } from 'uniswap/src/features/transactions/swap/review/hooks/useSwapOnPrevious'
import { SubmitSwapButton } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/SwapReviewFooter/SubmitSwapButton'
import { activePlanStore } from 'uniswap/src/features/transactions/swap/review/stores/activePlan/activePlanStore'
import { useSwapReviewCallbacksStore } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewCallbacksStore/useSwapReviewCallbacksStore'
import { useShowInterfaceReviewSteps } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewStore/useSwapReviewStore'
import { useSwapReviewTransactionStore } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewTransactionStore/useSwapReviewTransactionStore'
import { useSwapReviewWarningStore } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewWarningStore/useSwapReviewWarningStore'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { isValidSwapTxContext } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { isChained } from 'uniswap/src/features/transactions/swap/utils/routing'
import { UnichainPoweredMessage } from 'uniswap/src/features/transactions/TransactionDetails/UnichainPoweredMessage'
import { getShouldDisplayTokenWarningCard } from 'uniswap/src/features/transactions/TransactionDetails/utils/getShouldDisplayTokenWarningCard'
import { SagaStatus, useMonitoredSagaStatus } from 'uniswap/src/utils/saga'
import { isWebPlatform } from 'utilities/src/platform'
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
      <Flex row gap="$spacing8">
        {!isWebPlatform && !showPendingUI && (
          <IconButton
            icon={<BackArrow />}
            emphasis="secondary"
            size={isShortMobileDevice ? 'medium' : 'large'}
            onPress={onPrev}
          />
        )}
        <SubmitSwapButton disabled={disabled} showPendingUI={showPendingUI} warning={warning} onSubmit={onSubmit} />
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
      isTokenWarningBlocking ||
      isSwapOrPlanSagaRunning
    )
  }, [
    swapTxContext,
    isWrap,
    blockingWarning,
    newTradeRequiresAcceptance,
    isSubmitting,
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
