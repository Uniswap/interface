import { TradingApi } from '@universe/api'
import { useEffect, useMemo, useState } from 'react'
import { NO_ANIMATION_INDEX, PLAN_FETCH_STEP_INDEX } from 'uniswap/src/features/transactions/swap/plan/utils'
import { useSwapReviewStore } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewStore/useSwapReviewStore'
import { useSwapReviewTransactionStore } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewTransactionStore/useSwapReviewTransactionStore'
import { PendingSwapButtonContent } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/SwapReviewFooter/PendingSwapButtonContent'
import { isChained } from 'uniswap/src/features/transactions/swap/utils/routing'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

export interface PendingSwapButtonProps {
  disabled: boolean
  onSubmit: () => void
}

/**
 * Pending button for the swap review flow after the user has submitted a swap. Reads chained-plan
 * progress from the swap review stores, so it must render inside SwapReviewScreen's providers.
 * Flows with their own progress source (e.g. Earn) render PendingSwapButtonContent directly.
 */
export function PendingSwapButton({ disabled, onSubmit }: PendingSwapButtonProps): JSX.Element {
  const [steps, setSteps] = useState<TradingApi.TruncatedPlanStep[] | undefined>(undefined)
  const { currentStep } = useSwapReviewStore((s) => ({
    currentStep: s.currentStep,
  }))
  const { quote } = useSwapReviewTransactionStore((s) => ({
    quote: s.trade?.quote,
  }))

  useEffect(() => {
    if (quote && isChained(quote) && steps === undefined) {
      setSteps(quote.quote.steps)
    }
  }, [quote, steps])

  const currentStepIndex = useMemo(() => {
    if (!steps) {
      return NO_ANIMATION_INDEX
    }
    const currentStepExists = currentStep && 'step' in currentStep && 'stepIndex' in currentStep.step
    if (currentStepExists) {
      // +1 offsets the synthetic plan-fetch step at index 0 of the progress estimates
      return 'stepIndex' in currentStep.step ? currentStep.step.stepIndex + 1 : NO_ANIMATION_INDEX
    } else {
      return PLAN_FETCH_STEP_INDEX
    }
  }, [steps, currentStep])

  return (
    <PendingSwapButtonContent
      disabled={disabled}
      currentStepIndex={currentStepIndex}
      steps={steps}
      testID={TestID.Swap}
      onSubmit={onSubmit}
    />
  )
}
