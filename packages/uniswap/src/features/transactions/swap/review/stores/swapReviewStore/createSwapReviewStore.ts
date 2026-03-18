import type { TransactionStep } from 'uniswap/src/features/transactions/steps/types'
import { isDevEnv } from 'utilities/src/environment/env'
import type { StoreApi, UseBoundStore } from 'zustand'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export type SwapReviewStore = UseBoundStore<StoreApi<SwapReviewState>>

export type SwapReviewState = {
  submissionError: Error | undefined
  onPressRetry: (() => void) | undefined
  steps: TransactionStep[]
  currentStep: { step: TransactionStep; accepted: boolean } | undefined
  hideContent: boolean
  actions: {
    setSubmissionError: (error?: Error) => void
    setRetrySwap: (onPressRetry?: () => void) => void
    setSteps: (steps: TransactionStep[]) => void
    setCurrentStep: (step: { step: TransactionStep; accepted: boolean } | undefined) => void
    resetCurrentStep: () => void
    setHideContent: (hideContent: boolean) => void
  }
}

export const EMPTY_STEPS: TransactionStep[] = []

export const createSwapReviewStore = ({ hideContent }: { hideContent: boolean }): SwapReviewStore =>
  create<SwapReviewState>()(
    devtools(
      (set) => ({
        submissionError: undefined,
        onPressRetry: undefined,
        steps: EMPTY_STEPS,
        currentStep: undefined,
        hideContent,
        actions: {
          setSubmissionError: (error): void => set({ submissionError: error }),
          setRetrySwap: (onPressRetry): void => set({ onPressRetry }),
          setSteps: (steps): void => set({ steps }),
          setCurrentStep: (currentStep): void => set({ currentStep }),
          resetCurrentStep: (): void => set({ currentStep: undefined }),
          setHideContent: (hideContentParam): void => set({ hideContent: hideContentParam }),
        },
      }),
      {
        name: 'useSwapReviewStore',
        enabled: isDevEnv(),
        trace: true,
        traceLimit: 25,
      },
    ),
  )
