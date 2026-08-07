import { findLatestActiveFailedStep } from 'uniswap/src/features/transactions/swap/plan/collapseRetrySteps'
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
  return {
    hasActivePlan: true,
    // Semantic rather than positional: failed rows may not sit immediately before the actionable
    // row, and stale (recovered) failures don't count.
    lastStepFailed: findLatestActiveFailedStep(state.activePlan.steps) !== undefined,
  }
}

export function useActivePlanStatus(): UseActivePlanStatusResult {
  return useStore(activePlanStore, useShallow(selectActivePlanStatus))
}
