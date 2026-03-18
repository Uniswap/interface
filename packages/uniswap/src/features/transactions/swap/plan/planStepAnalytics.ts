import { InterfaceEventName, SwapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { TransactionAndPlanStep } from 'uniswap/src/features/transactions/swap/plan/planStepTransformer'
import { type PlanSagaAnalytics } from 'uniswap/src/features/transactions/swap/plan/types'
import { SwapEventType, timestampTracker } from 'uniswap/src/features/transactions/swap/utils/SwapEventTimestampTracker'
import { TransactionOriginType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { logger } from 'utilities/src/logger/logger'

/**
 * Returns a composite ID for plan step analytics events.
 *
 * Regular swaps use the transaction ID as the analytics `id`, but plan/chained-action
 * swaps emit multiple events (one per step). This composite format encodes both the plan
 * and the step position so downstream analytics can correlate events within a multi-step flow.
 */
function getPlanStepAnalyticsId(analytics: PlanSagaAnalytics): string {
  return `${analytics.plan_id}-${analytics.step_index}`
}

export function logPlanSwapStepCompleted(params: {
  analyticsWithPlanStepContext: PlanSagaAnalytics
  hash: string
  chainId: number
  orderHash?: string
}): void {
  const { analyticsWithPlanStepContext, hash, chainId, orderHash } = params
  const hasSetSwapSuccess = timestampTracker.hasTimestamp(SwapEventType.FirstSwapSuccess)
  const elapsedTime = timestampTracker.setElapsedTime(SwapEventType.FirstSwapSuccess)

  sendAnalyticsEvent(SwapEventName.SwapTransactionCompleted, {
    ...analyticsWithPlanStepContext,
    routing: analyticsWithPlanStepContext.routing,
    hash,
    chain_id: chainId,
    id: getPlanStepAnalyticsId(analyticsWithPlanStepContext),
    transactionOriginType: TransactionOriginType.Internal,
    time_to_swap: hasSetSwapSuccess ? undefined : elapsedTime,
    time_to_swap_since_first_input: hasSetSwapSuccess
      ? undefined
      : timestampTracker.getElapsedTime(SwapEventType.FirstSwapSuccess, SwapEventType.FirstSwapAction),
    ...(orderHash ? { order_hash: orderHash } : {}),
  })
}

export function logPlanSwapStepFailed(params: {
  analyticsWithPlanStepContext: PlanSagaAnalytics
  hash: string | undefined
  chainId: number
  orderHash?: string
}): void {
  const { analyticsWithPlanStepContext, hash, chainId, orderHash } = params
  sendAnalyticsEvent(SwapEventName.SwapTransactionFailed, {
    ...analyticsWithPlanStepContext,
    routing: analyticsWithPlanStepContext.routing,
    hash,
    chain_id: chainId,
    id: getPlanStepAnalyticsId(analyticsWithPlanStepContext),
    transactionOriginType: TransactionOriginType.Internal,
    ...(orderHash ? { order_hash: orderHash } : {}),
  })
}

export function logUniswapXPlanOrderSubmitted(params: { analyticsWithPlanStepContext: PlanSagaAnalytics }): void {
  const { analyticsWithPlanStepContext } = params
  sendAnalyticsEvent(InterfaceEventName.UniswapXOrderSubmitted, {
    ...analyticsWithPlanStepContext,
  })
}

const TRADE_STEP_TYPES = new Set<TransactionStepType>([
  TransactionStepType.SwapTransaction,
  TransactionStepType.SwapTransactionBatched,
  TransactionStepType.UniswapXPlanSignature,
])

/**
 * Shared helper that extracts proof identifiers from updated plan steps, resolves
 * the final step hash / order hash, and dispatches SwapTransactionCompleted or
 * SwapTransactionFailed analytics (with error logging for missing chainId/hash).
 *
 * Only logs for trade step types (SwapTransaction, SwapTransactionBatched,
 * UniswapXPlanSignature). Non-trade steps (approvals, permits) are silently skipped.
 *
 * Used by both the inline non-last-step logging path and the forked last-step watcher.
 */
export function logPlanStepTradeAnalytics(params: {
  stepType: TransactionStepType
  updatedSteps: TransactionAndPlanStep[] | undefined
  stepIndex: number
  hash: string | undefined
  chainId: number | undefined
  stepFailure: boolean
  analyticsWithPlanStepContext: PlanSagaAnalytics
  errorExtra?: Record<string, unknown>
}): void {
  const { stepType, updatedSteps, stepIndex, hash, chainId, stepFailure, analyticsWithPlanStepContext, errorExtra } =
    params

  if (!TRADE_STEP_TYPES.has(stepType)) {
    return
  }

  // For UniswapX steps the proof (txHash = fill hash, orderId = order hash) is populated
  // by TAPI after submission; for classic steps updatedProof is harmlessly undefined.
  const updatedProof = updatedSteps?.[stepIndex]?.proof
  const stepHash = hash ?? updatedProof?.txHash
  const orderHash = updatedProof?.orderId

  const expandedErrorExtra = { ...errorExtra, chainId, stepIndex, stepHash, orderHash, updatedProof }

  if (!chainId) {
    logger.error(new Error('Missing chainId for plan step analytics'), {
      tags: { file: 'planStepAnalytics', function: 'logPlanStepTradeAnalytics' },
      extra: expandedErrorExtra,
    })
  } else if (stepFailure) {
    logPlanSwapStepFailed({ analyticsWithPlanStepContext, hash: stepHash, chainId, orderHash })
  } else if (stepHash) {
    logPlanSwapStepCompleted({ analyticsWithPlanStepContext, hash: stepHash, chainId, orderHash })
  } else {
    logger.error(new Error('Missing stepHash for completed plan step analytics'), {
      tags: { file: 'planStepAnalytics', function: 'logPlanStepTradeAnalytics' },
      extra: expandedErrorExtra,
    })
  }
}
