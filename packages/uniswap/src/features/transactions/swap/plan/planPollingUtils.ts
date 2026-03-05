import { call, put, type SagaGenerator, select } from 'typed-redux-saga'
import { TradingApiSessionClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiSessionClient'
import extractPlanResponseDetails from 'uniswap/src/features/activity/extract/extractPlanResponseDetails'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { selectPlanTransaction } from 'uniswap/src/features/transactions/selectors'
import { transactionActions } from 'uniswap/src/features/transactions/slice'
import { PlanWatcher } from 'uniswap/src/features/transactions/swap/plan/planWatcherSaga'
import { activePlanStore } from 'uniswap/src/features/transactions/swap/review/stores/activePlan/activePlanStore'
import {
  PlanTransactionDetails,
  TransactionDetails,
  TransactionStatus,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import {
  isFinalizedTx,
  isFinalizedTxStatus,
  isPlanTransactionDetails,
} from 'uniswap/src/features/transactions/types/utils'
import { logger } from 'utilities/src/logger/logger'
import { ONE_HOUR_MS, ONE_SECOND_MS } from 'utilities/src/time/time'

/** Maximum age for a plan to be watched - plans older than this are removed from the watcher */
export const PLAN_MAX_AGE_MS = ONE_HOUR_MS
/** Initial delay before starting to poll (to avoid hammering API on app start) */
export const PLAN_POLLING_INITIAL_DELAY_MS = ONE_SECOND_MS * 10
/** Polling interval for checking plan status */
export const PLAN_POLLING_INTERVAL_MS = ONE_SECOND_MS * 10

export interface PlanPollResult {
  /** The updated plan details if an update is needed, null otherwise */
  updatedPlan: PlanTransactionDetails | null
  /** Whether the plan should be removed from the watch list */
  shouldRemoveFromWatchList: boolean
}

/**
 * Fetches plan status from the API and determines if an update is needed.
 * This is the core polling logic that can be used by both saga and hooks.
 *
 * @param planId - The plan ID to poll
 * @param localPlan - The current local plan state
 * @returns The poll result containing the updated plan (if any) and whether to remove from watch list
 */
export async function pollPlanStatus(localPlan: PlanTransactionDetails): Promise<PlanPollResult> {
  if (!shouldPollPlan(localPlan)) {
    return { updatedPlan: null, shouldRemoveFromWatchList: true }
  }
  const planId = localPlan.typeInfo.planId

  try {
    const remotePlanResponse = await TradingApiSessionClient.getExistingPlan({ planId })
    const updatedPlanDetails = extractPlanResponseDetails(remotePlanResponse)

    if (!updatedPlanDetails || !isPlanTransactionDetails(updatedPlanDetails)) {
      logger.warn(
        'planPollingUtils',
        'pollPlanStatus',
        'Failed to get plan details from API or map a valid plan transaction details. Stopping poll.',
        {
          planId,
          remotePlanResponse,
        },
      )
      return { updatedPlan: null, shouldRemoveFromWatchList: true }
    }

    // Preserve Cancelling status if the local plan has it and API hasn't returned a final state yet
    if (localPlan.status === TransactionStatus.Cancelling && !isFinalizedTxStatus(updatedPlanDetails.status)) {
      updatedPlanDetails.status = TransactionStatus.Cancelling
    }

    const isFinal = isFinalizedTxStatus(updatedPlanDetails.status)

    // Clean up cancelled plan tracking when the plan reaches a final state
    if (isFinal) {
      activePlanStore.getState().actions.clearCancelledPlan(planId)
    }

    return {
      updatedPlan: updatedPlanDetails,
      shouldRemoveFromWatchList: isFinal,
    }
  } catch (error) {
    if (!shouldPollPlan(localPlan)) {
      logger.warn('planPollingUtils', 'pollPlanStatus', 'Issue with polling for plan. Stopping poll.', {
        planId,
        error,
      })
      return { updatedPlan: null, shouldRemoveFromWatchList: true }
    }
    logger.warn('planPollingUtils', 'pollPlanStatus', 'Failed to poll plan status. Will try again.', {
      planId,
      error,
    })
    return { updatedPlan: null, shouldRemoveFromWatchList: false }
  }
}

/**
 * Returns an action to add or update a plan transaction depending on if the
 * plan exists or not. Also checks if the plan is fresher than the existing plan
 * to determine if an update is needed.
 */
export function getAddOrUpdatePlanAction(
  existingPlan: TransactionDetails | undefined,
  updatedPlanTransaction: PlanTransactionDetails,
):
  | ReturnType<typeof transactionActions.addTransaction>
  | ReturnType<typeof transactionActions.updateTransaction>
  | undefined {
  if (existingPlan) {
    if (shouldUpdatePlan({ existingPlan, newPlan: updatedPlanTransaction })) {
      // Preserve Cancelling status if existing plan has it and new plan isn't finalized
      if (existingPlan.status === TransactionStatus.Cancelling && !isFinalizedTxStatus(updatedPlanTransaction.status)) {
        updatedPlanTransaction.status = TransactionStatus.Cancelling
      }
      // Clean up cancelled plan tracking when the plan reaches a final state
      if (isFinalizedTxStatus(updatedPlanTransaction.status)) {
        activePlanStore.getState().actions.clearCancelledPlan(updatedPlanTransaction.typeInfo.planId)
      }
      return transactionActions.updateTransaction(updatedPlanTransaction)
    }
    return undefined
  } else {
    return transactionActions.addTransaction(updatedPlanTransaction)
  }
}

/** Saga helper for getAddOrUpdatePlanAction */
export function* addOrUpdatePlanTransaction(params: {
  updatedPlanTransaction: PlanTransactionDetails
  address: Address
  sourceChainId: UniverseChainId
}): SagaGenerator<void> {
  const { updatedPlanTransaction, address, sourceChainId } = params
  const existingPlan = yield* select(selectPlanTransaction, {
    address,
    chainId: sourceChainId,
    planId: updatedPlanTransaction.typeInfo.planId,
  })
  const action = getAddOrUpdatePlanAction(existingPlan, updatedPlanTransaction)
  if (action) {
    yield* put(action)
  }
}

export function* waitForPlanUpdateOrFinalizedState(
  planTx: PlanTransactionDetails,
): SagaGenerator<PlanTransactionDetails | undefined> {
  // AwaitingAction plans require user action and won't change from polling.
  // Return undefined so the watcher exits without dispatching an update.
  if (planTx.status === TransactionStatus.AwaitingAction) {
    return undefined
  }

  if (isFinalizedTx(planTx)) {
    return planTx
  }

  if (planIsTooOld(planTx)) {
    return { ...planTx, status: TransactionStatus.AwaitingAction }
  }

  return yield* call(PlanWatcher.waitForPlanStatus, planTx.typeInfo.planId)
}

export const shouldUpdatePlan = (params: {
  existingPlan: TransactionDetails
  newPlan: PlanTransactionDetails
}): boolean => {
  const { existingPlan, newPlan } = params
  return 'updatedTime' in existingPlan && 'updatedTime' in newPlan && newPlan.updatedTime > existingPlan.updatedTime
}

export const planIsTooOld = (plan: PlanTransactionDetails): boolean => {
  return Date.now() - plan.updatedTime > PLAN_MAX_AGE_MS
}

export const shouldPollPlan = (plan: PlanTransactionDetails): plan is PlanTransactionDetails => {
  return !isFinalizedTx(plan) && !planIsTooOld(plan) && plan.status === TransactionStatus.Pending
}

export function logPlanPollDebug({
  fileName = 'planPollingUtils',
  functionName = 'planPollingDebugLogger',
  message,
  extras,
}: {
  fileName?: string
  functionName?: string
  message: string
  extras?: Record<string, unknown>
}): void {
  logger.debug(fileName, functionName, `PlanPollingLogs: ${message}`, {
    ...extras,
  })
}
