import { useEffect, useRef } from 'react'
import { batch, useDispatch, useSelector } from 'react-redux'
import { selectTransactions } from 'uniswap/src/features/transactions/selectors'
import { getAddOrUpdatePlanAction, shouldPollPlan } from 'uniswap/src/features/transactions/swap/plan/planPollingUtils'
import { activePlanStore } from 'uniswap/src/features/transactions/swap/review/stores/activePlan/activePlanStore'
import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { isPlanTransactionDetails } from 'uniswap/src/features/transactions/types/utils'
import { logger } from 'utilities/src/logger/logger'
import { useStore } from 'zustand'

/**
 * Syncs remote plans awaiting updates to local Redux state so they can be watched for updates.
 * Excludes active plan since it's already being watched by useActivePlanTransactions.
 */
export function useSyncRemotePlans(remoteTransactions: TransactionDetails[] | undefined): void {
  const dispatch = useDispatch()
  const transactions = useSelector(selectTransactions)
  const activePlanId = useStore(activePlanStore, (state) => state.activePlan?.planId)
  const transactionsRef = useRef(transactions)
  transactionsRef.current = transactions

  useEffect(() => {
    if (!remoteTransactions?.length) {
      return
    }
    const remotePlanTransactions = remoteTransactions.filter((tx) => isPlanTransactionDetails(tx) && shouldPollPlan(tx))

    batch(() => {
      for (const remotePlan of remotePlanTransactions) {
        try {
          const planId = remotePlan.typeInfo.planId
          if (planId === activePlanId) {
            continue
          }
          const localPlan = transactionsRef.current[remotePlan.from]?.[remotePlan.chainId]?.[remotePlan.id]
          if (localPlan && !isPlanTransactionDetails(localPlan)) {
            logger.warn(
              'useSyncRemotePlans',
              'sync',
              'For some reason local plan is not a plan transaction details and indicates an issues when storing a plan. Overwriting with remote plan.',
              {
                localPlan,
              },
            )
          }
          const action = getAddOrUpdatePlanAction(localPlan, remotePlan)
          if (action) {
            dispatch(action)
          }
        } catch (error) {
          logger.error(error, {
            tags: { file: 'useSyncRemotePlans', function: 'sync' },
            extra: { id: remotePlan.id },
          })
        }
      }
    })
  }, [remoteTransactions, dispatch, activePlanId])
}
