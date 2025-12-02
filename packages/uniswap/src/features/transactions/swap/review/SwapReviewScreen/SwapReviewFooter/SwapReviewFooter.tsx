import { memo, useMemo } from 'react'
import { Flex, IconButton, useIsShortMobileDevice } from 'ui/src'
import { BackArrow } from 'ui/src/components/icons/BackArrow'
import type { Warning } from 'uniswap/src/components/modals/WarningModal/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TransactionModalFooterContainer } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModal'
import { useSwapOnPrevious } from 'uniswap/src/features/transactions/swap/review/hooks/useSwapOnPrevious'
import { SubmitSwapButton } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/SwapReviewFooter/SubmitSwapButton'
import { useSwapReviewCallbacksStore } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewCallbacksStore/useSwapReviewCallbacksStore'
import { useShowInterfaceReviewSteps } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewStore/useSwapReviewStore'
import { useSwapReviewTransactionStore } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewTransactionStore/useSwapReviewTransactionStore'
import { useSwapReviewWarningStore } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewWarningStore/useSwapReviewWarningStore'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { isValidSwapTxContext } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { UnichainPoweredMessage } from 'uniswap/src/features/transactions/TransactionDetails/UnichainPoweredMessage'
import { getShouldDisplayTokenWarningCard } from 'uniswap/src/features/transactions/TransactionDetails/utils/getShouldDisplayTokenWarningCard'
import { isWebPlatform } from 'utilities/src/platform'

export const SwapReviewFooter = memo(function SwapReviewFooter(): JSX.Element | null {
  const showInterfaceReviewSteps = useShowInterfaceReviewSteps()
  const { onPrev } = useSwapOnPrevious()
  const { disabled, showPendingUI, warning, onSubmit } = useSwapSubmitButton()
  const isShortMobileDevice = useIsShortMobileDevice()
  const { chainId } = useSwapReviewTransactionStore((s) => ({ chainId: s.chainId }))

  const isUnichain = !!(chainId && [UniverseChainId.Unichain, UniverseChainId.UnichainSepolia].includes(chainId))

  if (showInterfaceReviewSteps) {
    return null
  }

  return (
    <TransactionModalFooterContainer>
      {isUnichain && <UnichainPoweredMessage />}
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

  const submitButtonDisabled = useMemo(() => {
    const validSwap = isValidSwapTxContext(swapTxContext)
    const isTokenWarningBlocking = shouldDisplayTokenWarningCard && !tokenWarningChecked

    return (
      (!validSwap && !isWrap) ||
      !!blockingWarning ||
      newTradeRequiresAcceptance ||
      isSubmitting ||
      isTokenWarningBlocking
    )
  }, [
    swapTxContext,
    isWrap,
    blockingWarning,
    newTradeRequiresAcceptance,
    isSubmitting,
    tokenWarningChecked,
    shouldDisplayTokenWarningCard,
  ])

  return {
    disabled: submitButtonDisabled,
    showPendingUI,
    onSubmit: onSwapButtonClick,
    warning: reviewScreenWarning?.warning,
  }
}
