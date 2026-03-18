import { TradingApi } from '@universe/api'
import { call, delay, race, type SagaGenerator, spawn, take } from 'typed-redux-saga'
import { TradingApiSessionClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiSessionClient'
import extractPlanResponseDetails from 'uniswap/src/features/activity/extract/extractPlanResponseDetails'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { refetchRestQueriesViaOnchainOverrideVariant } from 'uniswap/src/features/portfolio/portfolioUpdates/rest/refetchRestQueriesViaOnchainOverrideVariantSaga'
import { HandledTransactionInterrupt } from 'uniswap/src/features/transactions/errors'
import { addOrUpdatePlanTransaction } from 'uniswap/src/features/transactions/swap/plan/planPollingUtils'
import { isPlanCancelledCheck } from 'uniswap/src/features/transactions/swap/plan/planSagaUtils'
import { TransactionAndPlanStep, transformSteps } from 'uniswap/src/features/transactions/swap/plan/planStepTransformer'
import { PlanStepTimeoutError } from 'uniswap/src/features/transactions/swap/plan/types'
import { stepHasFinalized } from 'uniswap/src/features/transactions/swap/plan/utils'
import { TransactionDetails, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { isPlanTransactionDetails } from 'uniswap/src/features/transactions/types/utils'
import { signalPlanCancellation } from 'uniswap/src/utils/saga'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

const MAX_ATTEMPTS = 60
const SLOWER_ATTEMPTS_THRESHOLD = MAX_ATTEMPTS / 2
const EXTENDED_POLLING_MULTIPLIER = 2

export interface WatchPlanStepParams {
  planId: string
  targetStepIndex: number
  address: Address
  stepChainId?: UniverseChainId
  sourceChainId: UniverseChainId
}

export interface WatchPlanStepResult {
  steps: TransactionAndPlanStep[]
  planResponse: TradingApi.PlanResponse
}

/**
 * Watches for a specific plan step to complete by polling the Trading API.
 * Returns the transformed steps and the latest plan response when the target step finalizes.
 *
 * Follows the same pattern as waitForRemoteUpdate - directly callable, returns result.
 */
export function* watchPlanStep(params: WatchPlanStepParams): SagaGenerator<WatchPlanStepResult> {
  const { planId, targetStepIndex, stepChainId, sourceChainId, address } = params

  const pollingInterval = stepChainId ? getChainInfo(stepChainId).tradingApiPollingIntervalMs : ONE_SECOND_MS
  let attempt = 0

  while (attempt < MAX_ATTEMPTS) {
    // Check cancellation at the start of each iteration
    if (isPlanCancelledCheck(planId)) {
      logger.debug('watchPlanStepSaga', 'watchPlanStep', 'Plan cancelled, stopping watch', { planId })
      throw new HandledTransactionInterrupt('Plan cancelled during step watch')
    }

    logger.debug('watchPlanStepSaga', 'watchPlanStep', 'waiting for step completion', {
      planId,
      targetStepIndex,
      attempt,
      maxAttempts: MAX_ATTEMPTS,
    })

    const tradeStatusResponse = yield* call(TradingApiSessionClient.getExistingPlan, { planId })

    const updatedPlanTx = extractPlanResponseDetails(tradeStatusResponse)
    if (!updatedPlanTx) {
      throw new Error(`Failed to extract plan response details for plan`, { cause: { planId } })
    }

    const latestTargetStep = tradeStatusResponse.steps.find(
      (_step: TradingApi.PlanStep) => _step.stepIndex === targetStepIndex,
    )

    if (!latestTargetStep) {
      throw new Error(`Target stepIndex=${targetStepIndex} not found in latest plan`, {
        cause: { planId, targetStepIndex },
      })
    }

    yield* call(addOrUpdatePlanTransaction, {
      updatedPlanTransaction: updatedPlanTx,
      address,
      sourceChainId,
    })

    if (stepHasFinalized(latestTargetStep)) {
      // Spawn balance refetch so it runs in the background (balances not needed for plan execution, just for UI display)
      yield* spawn(refetchBalancesForStep, {
        planTransaction: updatedPlanTx,
        stepIndex: targetStepIndex,
        address,
      })

      return { steps: transformSteps(tradeStatusResponse.steps), planResponse: tradeStatusResponse }
    }

    attempt++

    // Delay before next poll - race with cancellation signal
    const delayMs =
      attempt > SLOWER_ATTEMPTS_THRESHOLD ? pollingInterval * EXTENDED_POLLING_MULTIPLIER : pollingInterval

    const { cancelledDuringDelay } = yield* race({
      delayComplete: delay(delayMs),
      cancelledDuringDelay: take(signalPlanCancellation.type),
    })

    if (
      cancelledDuringDelay &&
      (cancelledDuringDelay as ReturnType<typeof signalPlanCancellation>).payload.planId === planId
    ) {
      logger.debug('watchPlanStepSaga', 'watchPlanStep', 'Plan cancelled during delay', { planId })
      throw new HandledTransactionInterrupt('Plan cancelled during step watch')
    }
  }

  throw new PlanStepTimeoutError(`Exceeded ${MAX_ATTEMPTS} attempts waiting for step completion`, {
    planId,
    targetStepIndex,
  })
}
/**
 * Triggers balance updates for a specific finalized step in a plan.
 */
function* refetchBalancesForStep({
  planTransaction,
  stepIndex,
  address,
}: {
  planTransaction: TransactionDetails
  stepIndex: number
  address: Address
}): Generator {
  if (!isPlanTransactionDetails(planTransaction)) {
    return
  }

  const step = planTransaction.typeInfo.stepDetails[stepIndex]
  if (step?.typeInfo.type === TransactionType.Swap || step?.typeInfo.type === TransactionType.Bridge) {
    yield* refetchRestQueriesViaOnchainOverrideVariant({
      transaction: step,
      activeAddress: address,
      apolloClient: null, // Skip NFT refetch for intermediate steps
    })
  }
}
