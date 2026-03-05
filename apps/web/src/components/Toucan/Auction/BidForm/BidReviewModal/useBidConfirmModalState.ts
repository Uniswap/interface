import { useCallback, useEffect, useState } from 'react'
import { PreparedBidTransaction, SubmitBidOptions } from '~/components/Toucan/Auction/hooks/useBidFormSubmit'
import { PendingModalError } from '~/pages/Swap/Limit/ConfirmSwapModal/Error'
import { ConfirmModalState } from '~/pages/Swap/Limit/ConfirmSwapModal/state'
import { didUserReject } from '~/utils/swapErrorToUserReadableMessage'

interface UseBidConfirmModalStateParams {
  preparedBid: PreparedBidTransaction | undefined
  onSubmit: (prepared?: PreparedBidTransaction, options?: SubmitBidOptions) => Promise<void>
  isOpen: boolean
}

export function useBidConfirmModalState({ preparedBid, onSubmit, isOpen }: UseBidConfirmModalStateParams) {
  const [confirmModalState, setConfirmModalState] = useState<ConfirmModalState>(ConfirmModalState.REVIEWING)
  const [approvalError, setApprovalError] = useState<PendingModalError>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const catchUserReject = useCallback((error: unknown, errorType: PendingModalError) => {
    setConfirmModalState(ConfirmModalState.REVIEWING)
    if (didUserReject(error)) {
      return
    }
    setApprovalError(errorType)
  }, [])

  const startBidFlow = useCallback(
    async (options?: SubmitBidOptions & { showProgressModal?: boolean }) => {
      const { showProgressModal = true, ...submitOptions } = options ?? {}
      if (showProgressModal) {
        setConfirmModalState(ConfirmModalState.PENDING_CONFIRMATION)
      }
      setIsSubmitting(true)
      try {
        await onSubmit(preparedBid, submitOptions)
      } catch (error) {
        catchUserReject(error, PendingModalError.CONFIRMATION_ERROR)
      } finally {
        setIsSubmitting(false)
      }
    },
    [catchUserReject, onSubmit, preparedBid],
  )

  useEffect(() => {
    if (!isOpen) {
      setConfirmModalState(ConfirmModalState.REVIEWING)
      setApprovalError(undefined)
      setIsSubmitting(false)
    }
  }, [isOpen])

  const resetToReviewScreen = useCallback(() => {
    setConfirmModalState(ConfirmModalState.REVIEWING)
  }, [])

  const onCancel = useCallback(() => {
    setConfirmModalState(ConfirmModalState.REVIEWING)
    setApprovalError(undefined)
    setIsSubmitting(false)
  }, [])

  return {
    confirmModalState,
    approvalError,
    startBidFlow,
    resetToReviewScreen,
    onCancel,
    isSubmitting,
  }
}
