import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useEffect, useMemo, useRef } from 'react'
import {
  PLAN_POLLING_INITIAL_DELAY_MS,
  PLAN_POLLING_INTERVAL_MS,
  pollPlanStatus,
  shouldPollPlan,
} from 'uniswap/src/features/transactions/swap/plan/planPollingUtils'
import { activePlanStore } from 'uniswap/src/features/transactions/swap/review/stores/activePlan/activePlanStore'
import { isFinalizedTxStatus, isPlanTransactionDetails } from 'uniswap/src/features/transactions/types/utils'
import { logger } from 'utilities/src/logger/logger'
import { useStore } from 'zustand'
import { ActivityPlanUpdate, ActivityUpdateTransactionType, type OnActivityUpdate } from '~/state/activity/types'
import { usePendingPlanTransactions, usePlanTransactions } from '~/state/transactions/hooks'

/**
 * Watches for active plans and updates the activity state for them only when they are finalized.
 */
export function useActivePlanTransactions(onActivityUpdate: OnActivityUpdate<ActivityPlanUpdate>): void {
  const activePlanId = useStore(activePlanStore, (state) => state.activePlan?.planId)
  const activePlanIdsRef = useRef<Set<string>>(new Set())
  const planTransactions = usePlanTransactions(Array.from(activePlanIdsRef.current))

  useEffect(() => {
    if (activePlanId) {
      activePlanIdsRef.current.add(activePlanId)
    }
  }, [activePlanId])

  useEffect(() => {
    for (const planTransaction of planTransactions) {
      if (!isPlanTransactionDetails(planTransaction) || !isFinalizedTxStatus(planTransaction.status)) {
        continue
      }
      const { planId } = planTransaction.typeInfo
      try {
        onActivityUpdate({
          type: ActivityUpdateTransactionType.Plan,
          chainId: planTransaction.chainId,
          update: planTransaction,
        })
        activePlanIdsRef.current.delete(planId)
      } catch (error) {
        logger.debug('plans', 'useActivePlanTransactions', 'Failed to update plan transaction', {
          planId,
          error,
        })
      }
    }
  }, [planTransactions, onActivityUpdate])
}

/**
 * Polls the Trading API for pending plan transaction status updates. Initial
 * poll is shorter and then a longer interval after that. Polling resets when
 * the number of pollable plans changes. Excludes active plan since it's
 * already being polled by watchPlanStepSaga.
 */
export function usePollPendingPlanTransactions(onActivityUpdate: OnActivityUpdate<ActivityPlanUpdate>): void {
  const chainedActionsEnabled = useFeatureFlag(FeatureFlags.ChainedActions)
  const activePlanId = useStore(activePlanStore, (state) => state.activePlan?.planId)
  const pendingPlans = usePendingPlanTransactions()
  const pendingPlansRef = useRef(pendingPlans)
  const activePlanIdRef = useRef(activePlanId)
  const onActivityUpdateRef = useRef(onActivityUpdate)

  const pollablePlansCount = useMemo(
    () => pendingPlans.filter((plan) => shouldPollPlan(plan) && plan.typeInfo.planId !== activePlanId).length,
    [pendingPlans, activePlanId],
  )

  useEffect(() => {
    pendingPlansRef.current = pendingPlans
    activePlanIdRef.current = activePlanId
    onActivityUpdateRef.current = onActivityUpdate
  }, [pendingPlans, activePlanId, onActivityUpdate])

  useEffect(() => {
    if (!chainedActionsEnabled || pollablePlansCount === 0) {
      return undefined
    }

    let timeout: NodeJS.Timeout
    const isActiveRef: { current: boolean } = { current: true }

    async function poll(): Promise<void> {
      if (!isActiveRef.current) {
        return
      }

      for (const plan of pendingPlansRef.current) {
        if (!shouldPollPlan(plan) || plan.typeInfo.planId === activePlanIdRef.current) {
          continue
        }

        const result = await pollPlanStatus(plan)

        if (result.updatedPlan) {
          onActivityUpdateRef.current({
            type: ActivityUpdateTransactionType.Plan,
            chainId: result.updatedPlan.chainId,
            update: result.updatedPlan,
          })
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- can change during await
      if (isActiveRef.current) {
        timeout = setTimeout(poll, PLAN_POLLING_INTERVAL_MS)
      }
    }
    timeout = setTimeout(poll, PLAN_POLLING_INITIAL_DELAY_MS)

    return () => {
      isActiveRef.current = false
      clearTimeout(timeout)
    }
  }, [chainedActionsEnabled, pollablePlansCount])
}
