import { FeatureFlags, getFeatureFlag, getStatsigClient } from '@universe/gating'
import { call, delay, fork, select } from 'typed-redux-saga'
import { makeSelectPlanTransaction } from 'uniswap/src/features/transactions/selectors'
import {
  logPlanPollDebug,
  PLAN_MAX_AGE_MS,
  PLAN_POLLING_INITIAL_DELAY_MS,
  PLAN_POLLING_INTERVAL_MS,
  pollPlanStatus,
  shouldPollPlan,
} from 'uniswap/src/features/transactions/swap/plan/planPollingUtils'
import { PlanTransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

interface PlanListener {
  updatePlanStatus: (updatedPlan: PlanTransactionDetails) => void
  promise: Promise<PlanTransactionDetails>
  timeoutId: NodeJS.Timeout
}

export class PlanWatcher {
  private static listeners: { [planId: string]: PlanListener } = {}

  /**
   * There is an issue on extension where the sagas are initialized multiple times.
   * The first instance of this polling utility will not have access to the latest store.
   * As a temporary fix, we can use an index to track & cancel the previous instance of the polling utility.
   */
  private static index = 0

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
      PlanWatcher.listeners[planId]?.updatePlanStatus(localPlan)
      PlanWatcher.cleanupListener(planId)
      return
    }

    const result = yield* call(pollPlanStatus, localPlan)

    if (result.updatedPlan) {
      PlanWatcher.listeners[planId]?.updatePlanStatus(result.updatedPlan)
      PlanWatcher.cleanupListener(planId)
    } else if (result.shouldRemoveFromWatchList) {
      PlanWatcher.listeners[planId]?.updatePlanStatus(localPlan)
      PlanWatcher.cleanupListener(planId)
    }
  }

  static *waitForPlanStatus(planId: string) {
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

    let resolvePromise: (value: PlanTransactionDetails) => void
    const promise = new Promise<PlanTransactionDetails>((resolve) => {
      resolvePromise = resolve
    })

    const timeoutId = setTimeout(() => {
      const listener = PlanWatcher.listeners[planId]
      if (listener) {
        logger.warn('planWatcherSaga', 'waitForPlanStatus', 'Plan listener timed out', { planId })
        // Resolve with undefined to unblock the caller - they should handle this case
        // biome-ignore lint/suspicious/noExplicitAny: Resolving with undefined to signal timeout
        resolvePromise(undefined as any)
        delete PlanWatcher.listeners[planId]
      }
    }, PLAN_MAX_AGE_MS)

    // biome-ignore lint/style/noNonNullAssertion: Must appease typechecker since resolvePromise is assigned inside promise scope
    PlanWatcher.listeners[planId] = { updatePlanStatus: resolvePromise!, promise, timeoutId }
    return yield* call(() => promise)
  }
}
