import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { ChainedQuoteResponse, PlanResponse, PlanStep, PlanStepStatus, UpdateExistingPlanRequest } from '@universe/api'
import { delay } from 'typed-redux-saga'
import { TradingApiClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { TransactionAndPlanStep, transformSteps } from 'uniswap/src/features/transactions/swap/plan/planStepTransformer'
import { ValidatedSwapTxContext } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { isJupiter } from 'uniswap/src/features/transactions/swap/utils/routing'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

/** Switches to the proper chain, if needed. If a chain switch is necessary and it fails, returns success=false. */
export async function handleSwitchChains(params: {
  selectChain: (chainId: number) => Promise<boolean>
  startChainId?: number
  swapTxContext: ValidatedSwapTxContext
}): Promise<{ chainSwitchFailed: boolean }> {
  const { selectChain, startChainId, swapTxContext } = params

  const swapChainId = swapTxContext.trade.inputAmount.currency.chainId

  if (isJupiter(swapTxContext) || swapChainId === startChainId) {
    return { chainSwitchFailed: false }
  }

  const chainSwitched = await selectChain(swapChainId)

  return { chainSwitchFailed: !chainSwitched }
}

export function stepHasFinalized(step: PlanStep): boolean {
  return step.status === PlanStepStatus.COMPLETE || step.status === PlanStepStatus.STEP_ERROR
}

export function findFirstActionableStep<T extends PlanStep | TransactionAndPlanStep>(steps: T[]): T | undefined {
  return steps.find((step) => step.status === PlanStepStatus.AWAITING_ACTION)
}

export function allStepsComplete(steps: PlanStep[]): boolean {
  return steps.every((step) => step.status === PlanStepStatus.COMPLETE)
}

const MAX_ATTEMPTS = 60

/**
 * Waits for the target step to complete by polling the plan for the given planId and targetStepId.
 *
 * @returns The updated steps or no steps
 *
 * // TODO: SWAP-440 This will become a common saga that the TX watcher and planSaga will listen to
 */
export async function waitForStepCompletion(params: {
  chainId?: number
  planId: string
  targetStepIndex: PlanStep['stepIndex']
  currentStepIndex: number
  inputAmount: CurrencyAmount<Currency>
}): Promise<TransactionAndPlanStep[]> {
  const { chainId, planId, targetStepIndex, currentStepIndex, inputAmount } = params

  const pollingInterval = chainId ? getChainInfo(chainId).tradingApiPollingIntervalMs : ONE_SECOND_MS
  let attempt = 0

  try {
    while (attempt < MAX_ATTEMPTS) {
      logger.debug('planSaga', 'waitForStepCompletion', 'waiting for step completion', {
        currentStepIndex,
        attempt,
        maxAttempts: MAX_ATTEMPTS,
      })

      const tradeStatusResponse = await TradingApiClient.getExistingPlan({ planId })
      const latestTargetStep = tradeStatusResponse.steps.find((_step) => _step.stepIndex === targetStepIndex)
      if (!latestTargetStep) {
        throw new Error(`Target stepIndex=${targetStepIndex} not found in latest plan.`)
      }
      if (stepHasFinalized(latestTargetStep)) {
        return transformSteps(tradeStatusResponse.steps, inputAmount)
      }
      attempt++
      await delay(pollingInterval)
    }
    throw new Error(`Exceeded ${MAX_ATTEMPTS} attempts waiting for step completion`)
  } catch (error) {
    logger.error(error, { tags: { file: 'planSaga', function: 'waitForStepCompletion' } })
    throw error
  }
}

/**
 * Updates the existing plan with the given proof. If the update fails, it will retry the update.
 */
export async function updateExistingPlanWithRetry(
  params: UpdateExistingPlanRequest,
  maxRetries = 5,
): Promise<PlanResponse | undefined> {
  let attempt = 0
  while (attempt < maxRetries) {
    try {
      return await TradingApiClient.updateExistingPlan(params)
    } catch (error: unknown) {
      attempt++
      if (attempt >= maxRetries) {
        throw error
      }
      logger.debug(
        'planSaga',
        'retryUpdateExistingPlan',
        `🔁 Retry ${attempt}/${maxRetries} after error on updateExistingTrade ` + error,
      )
      await delay(ONE_SECOND_MS * attempt)
    }
  }
  return undefined
}

type PlanOperationParams =
  | { inputPlanId: string; quote?: ChainedQuoteResponse['quote']; routing?: ChainedQuoteResponse['routing'] }
  | { inputPlanId?: never; quote: ChainedQuoteResponse['quote']; routing: ChainedQuoteResponse['routing'] }

/**
 * Helper function to execute a plan API call. If a planId is provided,
 * it will refresh the plan if the operation is 'refresh'
 * or get the plan if the operation is 'get'.
 */
async function executePlanOperation(operation: 'get' | 'refresh', params: PlanOperationParams): Promise<PlanResponse> {
  const { inputPlanId, quote, routing } = params

  try {
    if (inputPlanId !== undefined) {
      return operation === 'refresh'
        ? await TradingApiClient.refreshExistingPlan({ planId: inputPlanId })
        : await TradingApiClient.getExistingPlan({ planId: inputPlanId })
    } else {
      return await TradingApiClient.createNewPlan({ quote, routing })
    }
  } catch (error) {
    throw new Error(`Failed to ${operation} plan: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Helper function to create or get a plan if the planId is provided.
 */
export async function createOrGetPlan(params: PlanOperationParams): Promise<PlanResponse> {
  return executePlanOperation('get', params)
}

/**
 * Helper function to create or update/refresh a plan if the planId is provided.
 */
export async function createOrRefreshPlan(params: PlanOperationParams): Promise<PlanResponse> {
  return executePlanOperation('refresh', params)
}
