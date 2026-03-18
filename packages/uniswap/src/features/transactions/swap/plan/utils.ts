import { ChainedQuoteResponse, TradingApi } from '@universe/api'
import { WalletExecutionContext } from '@universe/api/src/clients/trading/__generated__/models/WalletExecutionContext'
import { TradingApiSessionClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiSessionClient'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { TransactionAndPlanStep } from 'uniswap/src/features/transactions/swap/plan/planStepTransformer'
import { ValidatedSwapTxContext } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { isJupiter } from 'uniswap/src/features/transactions/swap/utils/routing'
import { validateTransactionRequest } from 'uniswap/src/features/transactions/swap/utils/trade'
import { tradingApiToUniverseChainId } from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { ValidatedTransactionRequest } from 'uniswap/src/features/transactions/types/transactionRequests'
import { RetryConfig, retryWithBackoff } from 'utilities/src/async/retryWithBackoff'
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

export function stepHasFinalized(step: TradingApi.PlanStep): boolean {
  return step.status === TradingApi.PlanStepStatus.COMPLETE || step.status === TradingApi.PlanStepStatus.STEP_ERROR
}

export function findFirstActionableStep<T extends TradingApi.PlanStep | TransactionAndPlanStep>(
  steps: T[],
): { index: number; step: T | undefined } {
  const index = steps.findIndex((step) => step.status === TradingApi.PlanStepStatus.AWAITING_ACTION)
  if (index === -1) {
    return { index: -1, step: undefined }
  }
  return { index, step: steps[index] }
}

/**
 * Finds the first active step in the plan which is in progress or awaiting action. If
 * none are found, if all steps are complete, the last step is returned.
 *
 * @returns The index and step of the first active step. Otherwise, the index is -1 and the step is undefined.
 */
export function findFirstActiveStep<T extends TradingApi.PlanStep | TransactionAndPlanStep>(
  steps: T[],
): { index: number; step: T | undefined } {
  let index = steps.findIndex(
    (step) =>
      step.status === TradingApi.PlanStepStatus.AWAITING_ACTION ||
      step.status === TradingApi.PlanStepStatus.IN_PROGRESS,
  )
  if (allStepsComplete(steps)) {
    index = steps.length - 1
  }
  if (index === -1) {
    return { index: -1, step: undefined }
  }
  return { index, step: steps[index] }
}

export function allStepsComplete(steps: TradingApi.PlanStep[]): boolean {
  return steps.every((step) => step.status === TradingApi.PlanStepStatus.COMPLETE)
}

type PlanOperationParams = { retryConfig: RetryConfig; walletExecutionContext?: WalletExecutionContext } & (
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
  const { retryConfig, inputPlanId, quote, routing, walletExecutionContext } = params
  return await retryWithBackoff({
    fn: async () => {
      if (inputPlanId !== undefined) {
        return operation === 'refresh'
          ? await TradingApiSessionClient.refreshExistingPlan({ planId: inputPlanId })
          : await TradingApiSessionClient.getExistingPlan({ planId: inputPlanId })
      } else {
        // @ts-expect-error - CHAINED is the only supported but doesn't satisfy input param type for some reason
        return await TradingApiSessionClient.createNewPlan({ quote, routing, walletExecutionContext })
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
 * getStepLogArray([{ stepType: 'swap' }, { stepType: 'approval' }]) // ['swap', 'approval']
 */
export const getStepLogArray = (steps: TransactionAndPlanStep[]): string[] => {
  return steps.map((step) => String(step.stepType))
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
/** Wait time in milliseconds for the plan fetch operation. */
const PLAN_FETCH_WAIT_TIME_MS = ONE_SECOND_MS * 4
/** Wait time in milliseconds for the approval permit step since it doesn't require an onchain finalization.*/
const APPROVAL_PERMIT_STEP_TIME_MS = ONE_SECOND_MS * 1.5

/**
 * Estimates swap how long a set of steps will take to complete to be used in a
 * progress bar. Includes an initial wait time for the plan fetch operation.
 *
 * @example
 * getSwapProgressState(
 *   steps: [
 *    { tokenInChainId: 1 },  // 100ms polling interval * 10 multiplier = 1s
 *    { tokenInChainId: 2 },  // 200ms polling interval * 10 multiplier = 2s
 *    { tokenInChainId: 3 },  // 500ms polling interval * 10 multiplier / divisor = 1s
 *   ],
 * )
 *
 * returns: {
 *   totalTime: 10000ms,
 *   stepTimings: [4000ms, 1000ms, 2000ms, 1000ms],
 *   stepPercentageRanges: [
 *     { min: 0, max: 50 },
 *     { min: 50, max: 62.5 },
 *     { min: 62.5, max: 87.5 },
 *     { min: 87.5, max: 100 },
 *   ],
 * }
 *
 * // TODO: SWAP-706 Subject to change based on final UX designs
 *
 * @returns The progress state object containing totalTime, stepTimings, and stepPercentageRanges.
 */
export function getPlanProgressEstimates(steps: TradingApi.TruncatedPlanStep[]): PlanProgressEstimates {
  const stepTimings: number[] = [
    PLAN_FETCH_WAIT_TIME_MS,
    ...steps.map((step, index) => {
      if (step.stepType === TradingApi.PlanStepType.APPROVAL_PERMIT) {
        return APPROVAL_PERMIT_STEP_TIME_MS
      }
      const universeChainId = tradingApiToUniverseChainId(step.tokenInChainId)
      let waitTime = universeChainId
        ? getChainInfo(universeChainId).tradingApiPollingIntervalMs
        : FALLBACK_STEP_POLLING_INTERVAL_MS
      waitTime *= STEP_WAIT_TIME_MULTIPLIER
      const isLastStep = index === steps.length - 1
      if (isLastStep) {
        waitTime = waitTime / LAST_STEP_WAIT_TIME_DIVISOR
      }
      return waitTime
    }),
  ]

  const totalTime = stepTimings.reduce((acc, curr) => acc + curr, 0)
  const stepPercentageRanges = toPercentageRanges(stepTimings)

  return {
    totalTime,
    stepTimings,
    stepPercentageRanges,
  }
}

export function parseSendCallsPlanStepPayload(
  payload: Record<string, unknown>,
): ValidatedTransactionRequest[] | undefined {
  const calls = payload['calls']
  const chainId = Number(payload['chainId'])

  if (!chainId || !Array.isArray(calls)) {
    return undefined
  }

  const validatedTransactionRequests: ValidatedTransactionRequest[] = []
  for (const call of calls) {
    const validated = validateTransactionRequest({ ...call, chainId })
    if (!validated) {
      return undefined
    }
    validatedTransactionRequests.push(validated)
  }

  return validatedTransactionRequests
}
