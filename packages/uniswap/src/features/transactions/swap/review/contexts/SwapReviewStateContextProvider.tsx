import { ReactNode, useState } from 'react'
import { TransactionStep } from 'uniswap/src/features/transactions/steps/types'
import { SwapReviewStateContext } from 'uniswap/src/features/transactions/swap/review/contexts/SwapReviewStateContext'
import { isInterface } from 'utilities/src/platform'

export const SwapReviewStateContextProvider = ({
  children,
  hideContent,
}: {
  children: ReactNode
  hideContent: boolean
}): JSX.Element => {
  const [submissionError, setSubmissionError] = useState<Error>()
  const [onPressRetry, setRetrySwap] = useState<(() => void) | undefined>()
  const [steps, setSteps] = useState<TransactionStep[]>([])
  const [currentStep, setCurrentStep] = useState<{ step: TransactionStep; accepted: boolean } | undefined>()
  const showInterfaceReviewSteps = Boolean(isInterface && currentStep && steps.length > 1) // Only show review steps UI for interface, while a step is active and there is more than 1 step

  const swapReviewState = {
    submissionError,
    onPressRetry,
    steps,
    currentStep,
    showInterfaceReviewSteps,
    hideContent,
    setSubmissionError,
    setRetrySwap,
    setSteps,
    setCurrentStep,
    resetCurrentStep: (): void => setCurrentStep(undefined),
  }

  return <SwapReviewStateContext.Provider value={swapReviewState}>{children}</SwapReviewStateContext.Provider>
}
