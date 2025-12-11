import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { ChainedQuoteResponse, TradingApi } from '@universe/api'
import { TradingApiClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TransactionAndPlanStep, transformSteps } from 'uniswap/src/features/transactions/swap/plan/planStepTransformer'
import { ValidatedSwapTxContext } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { isJupiter } from 'uniswap/src/features/transactions/swap/utils/routing'
import { RetryConfig, retryWithBackoff } from 'utilities/src/async/retryWithBackoff'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { sleep } from 'utilities/src/time/timing'

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

export function stepHasFinalized(step: TradingApi.PlanStep): boolean {
  return step.status === TradingApi.PlanStepStatus.COMPLETE || step.status === TradingApi.PlanStepStatus.STEP_ERROR
}

export function findFirstActionableStep<T extends TradingApi.PlanStep | TransactionAndPlanStep>(
  steps: T[],
): T | undefined {
  return steps.find((step) => step.status === TradingApi.PlanStepStatus.AWAITING_ACTION)
}

export function allStepsComplete(steps: TradingApi.PlanStep[]): boolean {
  return steps.every((step) => step.status === TradingApi.PlanStepStatus.COMPLETE)
}

const MAX_ATTEMPTS = 60
const SLOWER_ATTEMPTS_THRESHOLD = MAX_ATTEMPTS / 2
const EXTENDED_POLLING_MULTIPLIER = 2

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
  targetStepIndex: TradingApi.PlanStep['stepIndex']
  currentStepIndex: number
  inputAmount: CurrencyAmount<Currency>
}): Promise<TransactionAndPlanStep[]> {
  const { chainId, planId, targetStepIndex, currentStepIndex, inputAmount } = params

  const pollingInterval = chainId ? getChainInfo(chainId).tradingApiPollingIntervalMs : ONE_SECOND_MS
  let attempt = 0

  try {
    while (attempt < MAX_ATTEMPTS) {
      logger.debug('planSaga', 'waitForStepCompletion', 'waiting for step completion', {
        planId,
        targetStepIndex,
        currentStepIndex,
        attempt,
        maxAttempts: MAX_ATTEMPTS,
      })

      const tradeStatusResponse = await TradingApiClient.getExistingPlan({ planId })
      const latestTargetStep = tradeStatusResponse.steps.find(
        (_step: TradingApi.PlanStep) => _step.stepIndex === targetStepIndex,
      )
      if (!latestTargetStep) {
        throw new Error(`Target stepIndex=${targetStepIndex} not found in latest plan.`)
      }
      if (stepHasFinalized(latestTargetStep)) {
        return transformSteps(tradeStatusResponse.steps)
      }
      attempt++

      if (attempt > SLOWER_ATTEMPTS_THRESHOLD) {
        await sleep(pollingInterval * EXTENDED_POLLING_MULTIPLIER)
      } else {
        await sleep(pollingInterval)
      }
    }
    throw new Error(`Exceeded ${MAX_ATTEMPTS} attempts waiting for step completion`)
  } catch (error) {
    logger.error(error, {
      tags: { file: 'planSaga', function: 'waitForStepCompletion' },
      extra: {
        planId,
        targetStepIndex,
        currentStepIndex,
        inputAmount,
        maxAttempts: MAX_ATTEMPTS,
      },
    })
    throw error
  }
}

type PlanOperationParams = { retryConfig: RetryConfig } & (
  | ({ inputPlanId: string } & Maybe<Pick<ChainedQuoteResponse, 'quote' | 'routing'>>)
  | ({ inputPlanId?: never } & Pick<ChainedQuoteResponse, 'quote' | 'routing'>)
)

/**
 * Helper function to execute a plan API call. If a planId is provided,
 * it will refresh the plan if the operation is 'refresh'
 * or get the plan if the operation is 'get'.
 */
async function executePlanOperation(
  operation: 'get' | 'refresh',
  params: PlanOperationParams,
): Promise<TradingApi.PlanResponse> {
  const { retryConfig, inputPlanId, quote, routing } = params
  return await retryWithBackoff({
    fn: async () => {
      if (inputPlanId !== undefined) {
        return operation === 'refresh'
          ? await TradingApiClient.refreshExistingPlan({ planId: inputPlanId })
          : await TradingApiClient.getExistingPlan({ planId: inputPlanId })
      } else {
        // @ts-expect-error - CHAINED is the only supported but doesn't satisfy input param type for some reason
        return await TradingApiClient.createNewPlan({ quote, routing })
      }
    },
    config: retryConfig,
  })
}

/** Helper function to create or get a plan if the planId is provided. */
export async function createOrGetPlan(params: PlanOperationParams): Promise<TradingApi.PlanResponse> {
  return executePlanOperation('get', params)
}

/** Helper function to create or update/refresh a plan if the planId is provided. */
export async function createOrRefreshPlan(params: PlanOperationParams): Promise<TradingApi.PlanResponse> {
  return executePlanOperation('refresh', params)
}

/**
 * Returns an array of the types of steps in the plan. This is used
 * to for metrics and for analytics.
 *
 * @example
 * getStepLogArray([{ stepSwapType: 'swap' }, { stepSwapType: 'approval' }]) // ['swap', 'approval']
 */
export const getStepLogArray = (steps: TransactionAndPlanStep[]): string[] => {
  return steps.map((step) => String(step.stepSwapType))
}

/**
 * Returns an array of percentage ranges for a given length. Used as a
 * fallback when there is an issue calculating the percentage ranges.
 *
 * Example:
 * returnEmptyPercentageRanges(3)
 * // [{ min: 0, max: 33.33 }, { min: 33.33, max: 66.66 }, { min: 66.66, max: 100 }]
 */
function returnEmptyPercentageRanges(length: number): Array<{ min: number; max: number }> {
  return Array.from({ length }, (_, i) => ({
    min: (i * 100) / length,
    max: ((i + 1) * 100) / length,
  }))
}

/**
 * Takes an array of values and returns an array of objects with the min and max percentage ranges.
 *
 * For example, if the values are
 * input: [5, 20, 25]
 * return:  [{ min: 0, max: 10 }, { min: 10, max: 50 }, { min: 50, max: 100 }].
 */
function toPercentageRanges(values: number[]): Array<{ min: number; max: number }> {
  try {
    if (values.length === 0) {
      return returnEmptyPercentageRanges(0)
    }
    const total = values.reduce((sum, val) => sum + val, 0)

    if (total === 0) {
      return returnEmptyPercentageRanges(values.length)
    }

    // eslint-disable-next-line max-params
    return values.reduce<Array<{ min: number; max: number }>>((acc, value, index) => {
      const previousMax = index > 0 ? (acc[index - 1]?.max ?? 0) : 0
      const max = previousMax + (value / total) * 100
      return [...acc, { min: previousMax, max }]
    }, [])
  } catch (error) {
    logger.warn(
      'planSaga',
      'toPercentageRanges',
      'Error calculating percentage ranges. Proceeding with empty ranges.',
      { error, values },
    )
    return returnEmptyPercentageRanges(values.length)
  }
}

export type PlanProgressEstimates = {
  totalTime: number
  stepTimings: number[]
  stepPercentageRanges: Array<{ min: number; max: number }>
}

/** Multiplier selected based on eyeballing the time it takes for a step to complete. */
const STEP_WAIT_TIME_MULTIPLIER = 40
/** Divisor selected based on eyeballing the time it takes for last step to confirm submission. */
const LAST_STEP_WAIT_TIME_DIVISOR = 5
/** Fallback step wait time in milliseconds if the chainId is not found. */
const FALLBACK_STEP_POLLING_INTERVAL_MS = 500

/**
 * Estimates swap how long a set of steps will take to complete to be used in a
 * progress bar.
 *
 * @example
 * getSwapProgressState(
 *   steps: [
 *    { tokenInChainId: 1 },  // 100ms polling interval * 10 multiplier = 1s
 *    { tokenInChainId: 2 },  // 200ms polling interval * 10 multiplier = 2s
 *    { tokenInChainId: 3 },  // 600ms polling interval * 10 multiplier / 2 divisor = 3s
 *   ],
 * )
 *
 * returns: {
 *   totalTime: 6000ms,
 *   stepTimings: [1000ms, 2000ms, 3000ms],
 *   stepPercentageRanges: [
 *     { min: 0, max: 20 },
 *     { min: 20, max: 60 },
 *     { min: 60, max: 100 },
 *   ],
 * }
 *
 * // TODO: SWAP-706 Subject to change based on final UX designs
 *
 * @returns The progress state object containing totalTime, stepTimings, and stepPercentageRanges.
 */
export function getPlanProgressEstimates(steps: TradingApi.PlanStep[]): PlanProgressEstimates {
  const stepTimings: number[] = steps.map((step, index) => {
    let waitTime = step.tokenInChainId
      ? getChainInfo(step.tokenInChainId as unknown as UniverseChainId).tradingApiPollingIntervalMs
      : FALLBACK_STEP_POLLING_INTERVAL_MS
    waitTime *= STEP_WAIT_TIME_MULTIPLIER
    const isLastStep = index === steps.length - 1
    if (isLastStep) {
      waitTime = waitTime / LAST_STEP_WAIT_TIME_DIVISOR
    }
    return waitTime
  })

  const totalTime = stepTimings.reduce((acc, curr) => acc + curr, 0)
  const stepPercentageRanges = toPercentageRanges(stepTimings)

  return {
    totalTime,
    stepTimings,
    stepPercentageRanges,
  }
}
