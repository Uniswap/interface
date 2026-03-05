import { TradingApi } from '@universe/api'
import { useEffect, useMemo } from 'react'
import { TransactionAndPlanStep } from 'uniswap/src/features/transactions/swap/plan/planStepTransformer'
import {
  ActivePlanState,
  activePlanStore,
} from 'uniswap/src/features/transactions/swap/review/stores/activePlan/activePlanStore'
import { useSwapReviewActions } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewStore/useSwapReviewStore'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { useStore } from 'zustand'
import { useShallow } from 'zustand/shallow'

function selectActivePlanData(state: ActivePlanState):
  | {
      steps: TransactionAndPlanStep[]
      currentStep: TransactionAndPlanStep
      previousStep: TransactionAndPlanStep | undefined
      proofPending: boolean
    }
  | undefined {
  if (!state.activePlan) {
    return undefined
  }

  const { steps, currentStepIndex, proofPending } = state.activePlan

  const currentStep = steps[currentStepIndex]
  const previousStep = steps[currentStepIndex - 1]
  if (!currentStep) {
    return undefined
  }

  return { steps, currentStep, previousStep, proofPending }
}

export function SyncActivePlanEffects(): null {
  const activePlanData = useStore(activePlanStore, useShallow(selectActivePlanData))
  const { setSteps, setCurrentStep } = useSwapReviewActions()

  const isSubmitting = useSwapFormStore((state) => state.isSubmitting)
  const currentDisplayStep = useMemo(() => {
    // Highlight last failed step if it exists and we're not submitting
    if (activePlanData?.previousStep?.status === TradingApi.PlanStepStatus.STEP_ERROR && !isSubmitting) {
      return activePlanData.previousStep
    }

    return activePlanData?.currentStep
  }, [activePlanData?.currentStep, activePlanData?.previousStep, isSubmitting])

  useEffect(() => {
    if (activePlanData?.steps) {
      setSteps(activePlanData.steps)
    }
  }, [activePlanData?.steps, setSteps])

  useEffect(() => {
    if (currentDisplayStep) {
      setCurrentStep({ step: currentDisplayStep, accepted: activePlanData?.proofPending ?? false })
    }
  }, [currentDisplayStep, activePlanData?.proofPending, setCurrentStep])

  return null
}
