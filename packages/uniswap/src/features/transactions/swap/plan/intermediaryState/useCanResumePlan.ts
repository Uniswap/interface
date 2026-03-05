import { useMemo } from 'react'
import {
  ActivePlanState,
  activePlanStore,
} from 'uniswap/src/features/transactions/swap/review/stores/activePlan/activePlanStore'
import {
  PlanTransactionInfo,
  TransactionStatus,
  TransactionType,
  TransactionTypeInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { useStore } from 'zustand'

function planIsNotExecuting(typeInfo: TransactionTypeInfo, status: TransactionStatus): boolean {
  if (typeInfo.type !== TransactionType.Plan) {
    return false
  }

  // Plans awaiting action or failed can be resumed
  if (status === TransactionStatus.AwaitingAction || status === TransactionStatus.Failed) {
    return true
  }

  return false
}

function selectSwapFlowAlreadyHasActivePlan(state: ActivePlanState): boolean {
  if (!state.activePlan?.planId) {
    return false
  }

  // While this trigger is still in effect, the swap flow has not yet reacted to the plan being resumed.
  if (state.resumePlanSwapFormState) {
    return false
  }

  return true
}

export function useCanResumePlan(
  typeInfo: TransactionTypeInfo,
  status: TransactionStatus,
): typeInfo is PlanTransactionInfo {
  const swapFlowAlreadyHasActivePlan = useStore(activePlanStore, selectSwapFlowAlreadyHasActivePlan)

  return useMemo(() => {
    if (swapFlowAlreadyHasActivePlan) {
      return false
    }

    return planIsNotExecuting(typeInfo, status)
  }, [typeInfo, status, swapFlowAlreadyHasActivePlan])
}
