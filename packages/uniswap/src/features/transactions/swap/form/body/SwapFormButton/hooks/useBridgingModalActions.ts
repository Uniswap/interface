import { useCallback } from 'react'
import { OnReviewPress } from 'uniswap/src/features/transactions/swap/form/body/SwapFormButton/hooks/useOnReviewPress'

export const useBridgingModalActions = ({
  handleHideBridgingWarningModal,
  onReviewPress,
}: {
  handleHideBridgingWarningModal: () => void
  onReviewPress: OnReviewPress
}): {
  handleBridgingOnContinue: () => void
  handleBridgingOnClose: () => void
} => {
  const handleBridgingOnContinue = useCallback(() => {
    handleHideBridgingWarningModal()
    onReviewPress({ skipBridgingWarning: true, skipMaxTransferWarning: false, skipTokenProtectionWarning: true })
  }, [onReviewPress, handleHideBridgingWarningModal])

  return {
    handleBridgingOnContinue,
    handleBridgingOnClose: handleHideBridgingWarningModal,
  }
}
