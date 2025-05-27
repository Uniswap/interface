import { memo, useMemo } from 'react'
import { Flex, IconButton, isWeb, useIsShortMobileDevice } from 'ui/src'
import { BackArrow } from 'ui/src/components/icons/BackArrow'
import { Warning } from 'uniswap/src/components/modals/WarningModal/types'
import { getShouldDisplayTokenWarningCard } from 'uniswap/src/features/transactions/TransactionDetails/utils/getShouldDisplayTokenWarningCard'
import { TransactionModalFooterContainer } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModal'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { SubmitSwapButton } from 'uniswap/src/features/transactions/swap/review/SubmitSwapButton'
import { useSwapReviewCallbacks } from 'uniswap/src/features/transactions/swap/review/contexts/SwapReviewCallbacksContext'
import { useSwapReviewState } from 'uniswap/src/features/transactions/swap/review/contexts/SwapReviewStateContext'
import { useSwapReviewTransactionState } from 'uniswap/src/features/transactions/swap/review/contexts/SwapReviewTransactionContext'
import { useSwapWarningState } from 'uniswap/src/features/transactions/swap/review/contexts/SwapReviewWarningStateContext'
import { useSwapOnPrevious } from 'uniswap/src/features/transactions/swap/review/hooks/useSwapOnPrevious'
import { isValidSwapTxContext } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'

export const SwapReviewFooter = memo(function SwapReviewFooter(): JSX.Element | null {
  const { showInterfaceReviewSteps } = useSwapReviewState()
  const { onPrev } = useSwapOnPrevious()
  const { disabled, showPendingUI, warning, onSubmit } = useSwapSubmitButton()
  const isShortMobileDevice = useIsShortMobileDevice()

  if (showInterfaceReviewSteps) {
    return null
  }

  return (
    <TransactionModalFooterContainer>
      <Flex row gap="$spacing8">
        {!isWeb && !showPendingUI && (
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
} {
  const context = useSwapReviewTransactionState()
  const { tokenWarningChecked } = useSwapWarningState()
  const { isSubmitting, showPendingUI } = useSwapFormContext()
  const { onSwapButtonClick } = useSwapReviewCallbacks()
  const { shouldDisplayTokenWarningCard } = getShouldDisplayTokenWarningCard({
    tokenWarningProps: context.tokenWarningProps,
    feeOnTransferProps: context.feeOnTransferProps,
  })

  // Calculate disabled state here instead of in the provider
  const submitButtonDisabled = useMemo(() => {
    const validSwap = isValidSwapTxContext(context.swapTxContext)
    const isTokenWarningBlocking = shouldDisplayTokenWarningCard && !tokenWarningChecked

    return (
      (!validSwap && !context.isWrap) ||
      !!context.blockingWarning ||
      context.newTradeRequiresAcceptance ||
      isSubmitting ||
      isTokenWarningBlocking
    )
  }, [
    context.swapTxContext,
    context.isWrap,
    context.blockingWarning,
    context.newTradeRequiresAcceptance,
    isSubmitting,
    tokenWarningChecked,
    shouldDisplayTokenWarningCard,
  ])

  return {
    disabled: submitButtonDisabled,
    showPendingUI,
    onSubmit: onSwapButtonClick,
    warning: context.reviewScreenWarning?.warning,
  }
}
