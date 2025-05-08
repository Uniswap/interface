import { createContext, useContext } from 'react'
import { TransactionStep } from 'uniswap/src/features/transactions/swap/types/steps'

interface SwapReviewState {
  submissionError: Error | undefined
  steps: TransactionStep[]
  currentStep: { step: TransactionStep; accepted: boolean } | undefined
  showInterfaceReviewSteps: boolean
  hideContent: boolean
  setSubmissionError: (error?: Error) => void
  setSteps: (steps: TransactionStep[]) => void
  setCurrentStep: (step: { step: TransactionStep; accepted: boolean } | undefined) => void
  resetCurrentStep: () => void
}

export const SwapReviewStateContext = createContext<SwapReviewState>({
  submissionError: undefined,
  steps: [],
  currentStep: undefined,
  showInterfaceReviewSteps: false,
  hideContent: false,
  setSubmissionError: () => {},
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
