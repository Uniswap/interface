import { TradingApi } from '@universe/api'
import {
  ActivePlanState,
  activePlanStore,
} from 'uniswap/src/features/transactions/swap/review/stores/activePlan/activePlanStore'
import { useStore } from 'zustand'
import { useShallow } from 'zustand/shallow'

type UseActivePlanStatusResult = {
  hasActivePlan: boolean
  lastStepFailed: boolean
}

function selectActivePlanStatus(state: ActivePlanState): UseActivePlanStatusResult {
  if (!state.activePlan) {
    return {
      hasActivePlan: false,
      lastStepFailed: false,
    }
  }
  const lastStep = state.activePlan.steps[state.activePlan.currentStepIndex - 1]

  return {
    hasActivePlan: true,
    lastStepFailed: lastStep?.status === TradingApi.PlanStepStatus.STEP_ERROR,
  }
}

export function useActivePlanStatus(): UseActivePlanStatusResult {
  return useStore(activePlanStore, useShallow(selectActivePlanStatus))
}
