import { useCallback, useState } from 'react'
import { resetActivePlan } from 'uniswap/src/features/transactions/swap/plan/planSagaUtils'

type EarnReviewExecutionHandlersParams = {
  onBack: () => void
  onClose: () => void
  onExecutionFailure?: (error?: Error) => void
  onSuccess?: () => void
}

export function useEarnReviewExecutionHandlers({
  onBack,
  onClose,
  onExecutionFailure,
  onSuccess,
}: EarnReviewExecutionHandlersParams): {
  clearExecutionState: () => void
  executionError: Error | undefined
  handleBack: () => void
  handleClose: () => void
  handleFailure: (error?: Error, retry?: () => void) => void
  handleRetry: () => void
  handleSuccess: () => void
  isSubmitting: boolean
  onPressRetry: (() => void) | undefined
  startSubmitting: () => void
} {
  const [executionError, setExecutionError] = useState<Error | undefined>(undefined)
  const [onPressRetry, setOnPressRetry] = useState<(() => void) | undefined>(undefined)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const clearExecutionState = useCallback((): void => {
    setExecutionError(undefined)
    setOnPressRetry(undefined)
  }, [])

  const startSubmitting = useCallback((): void => {
    setIsSubmitting(true)
  }, [])

  const handleSuccess = useCallback((): void => {
    setIsSubmitting(false)
    onSuccess?.()
  }, [onSuccess])

  const handleFailure = useCallback(
    (error?: Error, retry?: () => void): void => {
      setIsSubmitting(false)
      setOnPressRetry(() => retry)
      // Handled interruptions return no displayable error; let the user retry from the modal.
      if (!error) {
        setExecutionError(undefined)
        return
      }
      setExecutionError(error)
      onExecutionFailure?.(error)
    },
    [onExecutionFailure],
  )

  const handleRetry = useCallback((): void => {
    setExecutionError(undefined)
    setIsSubmitting(true)
    onPressRetry?.()
  }, [onPressRetry])

  const handleBack = useCallback((): void => {
    if (executionError) {
      resetActivePlan()
    }
    onBack()
  }, [executionError, onBack])

  const handleClose = useCallback((): void => {
    if (executionError) {
      resetActivePlan()
    }
    onClose()
  }, [executionError, onClose])

  return {
    clearExecutionState,
    executionError,
    handleBack,
    handleClose,
    handleFailure,
    handleRetry,
    handleSuccess,
    isSubmitting,
    onPressRetry,
    startSubmitting,
  }
}
