import { FeatureFlags, getFeatureFlag, getStatsigClient } from '@universe/gating'
import { call, delay, fork, type SagaGenerator, select } from 'typed-redux-saga'
import { makeSelectPlanTransaction } from 'uniswap/src/features/transactions/selectors'
import {
  logPlanPollDebug,
  PLAN_MAX_AGE_MS,
  PLAN_POLLING_INITIAL_DELAY_MS,
  PLAN_POLLING_INTERVAL_MS,
  planIsTooOld,
  pollPlanStatus,
  shouldPollPlan,
} from 'uniswap/src/features/transactions/swap/plan/planPollingUtils'
import { PlanTransactionDetails, TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { isFinalizedTx } from 'uniswap/src/features/transactions/types/utils'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

interface PlanListener {
  resolvePlanStatus: (updatedPlan: PlanTransactionDetails | undefined) => void
  promise: Promise<PlanTransactionDetails | undefined>
  timeoutId: NodeJS.Timeout
}

export class PlanWatcher {
  private static listeners: { [planId: string]: PlanListener } = {}

  /**
   * There is an issue on extension where the sagas are initialized multiple times.
   * The first instance of this polling utility will not have access to the latest store.
   * As a temporary fix, we can use an index to track & cancel the previous instance of the polling utility.
   */
  private static index = 0;

  static *initialize(): Generator<unknown> {
    yield* call(PlanWatcher.waitForStatsigReady)
    if (!getFeatureFlag(FeatureFlags.ChainedActions)) {
      return
    }
    PlanWatcher.index++
    yield* fork(PlanWatcher.poll, PlanWatcher.index)
  }

  private static *waitForStatsigReady(): Generator<unknown> {
    while (getStatsigClient().loadingStatus !== 'Ready') {
      yield* delay(ONE_SECOND_MS)
    }
  }

  private static *poll(index: number): Generator<unknown> {
    if (index !== PlanWatcher.index) {
      return
    }
    yield* delay(PLAN_POLLING_INITIAL_DELAY_MS)

    try {
      const planIds = Object.keys(PlanWatcher.listeners)
      if (!planIds.length) {
        yield* fork(PlanWatcher.poll, index)
        return
      }

      for (const planId of planIds) {
        yield* call(PlanWatcher.processPlanPoll, planId)
      }
    } catch (error) {
      logger.error(error, {
        tags: {
          file: 'planWatcherSaga',
          function: 'poll',
        },
      })
    }
    yield* delay(PLAN_POLLING_INTERVAL_MS)
    yield* fork(PlanWatcher.poll, index)
  }

  private static cleanupListener(planId: string): void {
    logPlanPollDebug({
      functionName: 'cleanupListener',
      message: 'Cleaning up listener',
      extras: { planId },
    })
    const listener = PlanWatcher.listeners[planId]
    if (listener) {
      clearTimeout(listener.timeoutId)
      delete PlanWatcher.listeners[planId]
    }
  }

  private static *processPlanPoll(planId: string): Generator<unknown> {
    logPlanPollDebug({
      functionName: 'processPlanPoll',
      message: 'Processing plan poll',
      extras: { planId },
    })
    const selectPlanTransaction = yield* call(makeSelectPlanTransaction)
    const localPlan = yield* select(selectPlanTransaction, { planId })
    if (!localPlan) {
      PlanWatcher.cleanupListener(planId)
      return
    }

    if (!shouldPollPlan(localPlan)) {
      PlanWatcher.listeners[planId]?.resolvePlanStatus(localPlan)
      PlanWatcher.cleanupListener(planId)
      return
    }

    const result = yield* call(pollPlanStatus, localPlan)

    if (result.updatedPlan) {
      PlanWatcher.listeners[planId]?.resolvePlanStatus(result.updatedPlan)
      PlanWatcher.cleanupListener(planId)
    } else if (result.shouldRemoveFromWatchList) {
      PlanWatcher.listeners[planId]?.resolvePlanStatus(localPlan)
      PlanWatcher.cleanupListener(planId)
    }
  }

  static *waitForPlanStatus(planId: string): SagaGenerator<PlanTransactionDetails | undefined> {
    logPlanPollDebug({
      fileName: 'planWatcherSaga',
      functionName: 'waitForPlanStatus',
      message: 'Waiting for plan status',
      extras: { planId },
    })
    const existingListenerPromise = PlanWatcher.listeners[planId]?.promise
    if (existingListenerPromise) {
      return yield* call(() => existingListenerPromise)
    }

    let resolvePromise: (value: PlanTransactionDetails | undefined) => void = () => undefined
    const promise = new Promise<PlanTransactionDetails | undefined>((resolve) => {
      resolvePromise = resolve
    })

    const timeoutId = setTimeout(() => {
      const listener = PlanWatcher.listeners[planId]
      if (listener) {
        logger.warn('planWatcherSaga', 'waitForPlanStatus', 'Plan listener timed out', { planId })
        resolvePromise(undefined)
        delete PlanWatcher.listeners[planId]
      }
    }, PLAN_MAX_AGE_MS)

    PlanWatcher.listeners[planId] = {
      resolvePlanStatus: resolvePromise,
      promise,
      timeoutId,
    }
    return yield* call(() => promise)
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
