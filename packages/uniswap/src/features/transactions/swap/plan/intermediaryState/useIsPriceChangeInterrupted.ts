import {
  ActivePlanState,
  activePlanStore,
} from 'uniswap/src/features/transactions/swap/review/stores/activePlan/activePlanStore'
import { useStore } from 'zustand'

function selectPriceChangeInterruptedPlanIds(state: ActivePlanState): Set<string> {
  return state.priceChangeInterruptedPlanIds
}

/**
 * Returns true when a plan was interrupted due to a price change (>1% movement).
 * Used to show a price-change-specific UI variant instead of the generic intermediary state card.
 */
export function useIsPriceChangeInterrupted(planId: string): boolean {
  const priceChangeInterruptedPlanIds = useStore(activePlanStore, selectPriceChangeInterruptedPlanIds)
  return priceChangeInterruptedPlanIds.has(planId)
}
