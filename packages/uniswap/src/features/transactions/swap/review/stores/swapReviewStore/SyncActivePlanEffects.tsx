import { useEffect, useMemo } from 'react'
import { getPlanStepsForDisplay } from 'uniswap/src/features/transactions/swap/plan/collapseRetrySteps'
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
      proofPending: boolean
    }
  | undefined {
  if (!state.activePlan) {
    return undefined
  }

  const { steps, currentStepIndex, proofPending } = state.activePlan

  const currentStep = steps[currentStepIndex]
  if (!currentStep) {
    return undefined
  }

  return { steps, currentStep, proofPending }
}

export function SyncActivePlanEffects(): null {
  const activePlanData = useStore(activePlanStore, useShallow(selectActivePlanData))
  const { setSteps, setCurrentStep } = useSwapReviewActions()

  const isSubmitting = useSwapFormStore((state) => state.isSubmitting)

  // Collapse retry rows so each logical step renders once (latest failed attempt while awaiting
  // retry, live row while submitting), and pick the matching display step.
  const displayData = useMemo(() => {
    if (!activePlanData) {
      return undefined
    }
    return getPlanStepsForDisplay({
      steps: activePlanData.steps,
      currentStep: activePlanData.currentStep,
      isSubmitting,
    })
  }, [activePlanData, isSubmitting])

  useEffect(() => {
    if (displayData) {
      setSteps(displayData.displaySteps)
    }
  }, [displayData, setSteps])

  useEffect(() => {
    if (displayData) {
      setCurrentStep({ step: displayData.displayStep, accepted: activePlanData?.proofPending ?? false })
    }
  }, [displayData, activePlanData?.proofPending, setCurrentStep])

  return null
}
