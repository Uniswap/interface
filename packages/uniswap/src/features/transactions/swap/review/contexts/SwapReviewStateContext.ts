import { createContext, useContext } from 'react'
import { TransactionStep } from 'uniswap/src/features/transactions/steps/types'

interface SwapReviewState {
  submissionError: Error | undefined
  onPressRetry: (() => void) | undefined
  steps: TransactionStep[]
  currentStep: { step: TransactionStep; accepted: boolean } | undefined
  showInterfaceReviewSteps: boolean
  hideContent: boolean
  setSubmissionError: (error?: Error) => void
  setRetrySwap: (onPressRetry?: () => void) => void
  setSteps: (steps: TransactionStep[]) => void
  setCurrentStep: (step: { step: TransactionStep; accepted: boolean } | undefined) => void
  resetCurrentStep: () => void
}

export const SwapReviewStateContext = createContext<SwapReviewState>({
  submissionError: undefined,
  onPressRetry: undefined,
  steps: [],
  currentStep: undefined,
  showInterfaceReviewSteps: false,
  hideContent: false,
  setSubmissionError: () => {},
  setRetrySwap: () => {},
  setSteps: () => {},
  setCurrentStep: () => {},
  resetCurrentStep: () => {},
})

export const useSwapReviewState = (): SwapReviewState => {
  const context = useContext(SwapReviewStateContext)
  if (!context) {
    throw new Error('SwapReviewStateContext not found')
  }
  return context
}
