import { ChainedQuoteResponse, TradingApi } from '@universe/api'
import { PlanResponse } from '@universe/api/src/clients/trading/__generated__/models/PlanResponse'
import { WalletExecutionContext } from '@universe/api/src/clients/trading/__generated__/models/WalletExecutionContext'
import { call, race, SagaGenerator, take } from 'typed-redux-saga'
import { CAIP25Session } from 'uniswap/src/features/capabilities/caip25/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { AppNotificationType, SwapPendingNotification } from 'uniswap/src/features/notifications/slice/types'
import {
  TransformPlanParams,
  transformPlanResponseToChainedQuote,
} from 'uniswap/src/features/transactions/swap/hooks/useTradeFromExistingPlan'
import { TransactionAndPlanStep, transformSteps } from 'uniswap/src/features/transactions/swap/plan/planStepTransformer'
import { consumePrefetchedPlan } from 'uniswap/src/features/transactions/swap/plan/prefetchedPlanStore'
import { getPlanCompoundSlippageTolerance } from 'uniswap/src/features/transactions/swap/plan/slippage'
import {
  AbortPlanError,
  ExpectedPlanError,
  PlanParams,
  PlanValidationError,
} from 'uniswap/src/features/transactions/swap/plan/types'
import {
  createOrRefreshPlan,
  findFirstActiveStep,
  getStepLogArray,
} from 'uniswap/src/features/transactions/swap/plan/utils'
import {
  ActivePlanData,
  activePlanStore,
} from 'uniswap/src/features/transactions/swap/review/stores/activePlan/activePlanStore'
import { ValidatedTradeInput } from 'uniswap/src/features/transactions/swap/services/tradeService/transformations/buildQuoteRequest'
import { ValidatedChainedSwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { ChainedActionTrade, Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { signalSwapModalClosed } from 'uniswap/src/utils/saga'
import { isProdEnv } from 'utilities/src/environment/env'
import { logger } from 'utilities/src/logger/logger'

interface FetchAndTransformPlanParams {
  quote: ChainedQuoteResponse['quote']
  routing: ChainedQuoteResponse['routing']
  walletExecutionContext?: WalletExecutionContext
  trade: Trade
}

export interface FetchAndTransformPlanResult {
  planId: string
  steps: TransactionAndPlanStep[]
  inputChainId: UniverseChainId
  currentStepIndex: number
  currentStep: TransactionAndPlanStep
}

export function transformPlanResponse(response: PlanResponse): FetchAndTransformPlanResult {
  const steps = transformSteps(response.steps)
  const { index: currentStepIndex, step: currentStep } = findFirstActiveStep(steps)
  if (!currentStep) {
    throw new AbortPlanError('No active step found. Do not retry plan.')
  }
  const inputChainId = toSupportedChainId(steps[0]?.tokenInChainId)
  if (!inputChainId) {
    throw new AbortPlanError('No input chain id found. Do not retry plan.')
  }
  return { planId: response.planId, steps, inputChainId, currentStepIndex, currentStep }
}

interface InitializePlanResult extends FetchAndTransformPlanResult {
  response?: TradingApi.PlanResponse
  wasPlanResumed: boolean
}

/**
 * Initializes plan by creating one via TAPI, using an active plan from the store, or retrieving one if the inputPlanId is provided. If the
 * plan is not valid, an error is thrown.
 *
 * @throws AbortPlanError if the plan is not valid.
 * @throws PlanValidationError if the plan is not valid.
 */
export function* initializePlan(params: FetchAndTransformPlanParams): SagaGenerator<InitializePlanResult> {
  const { quote, routing, walletExecutionContext } = params

  // Case 1: Using a plan that already exists.
  const resumedPlanState = yield* call(getOrAwaitLatestActivePlan)

  if (resumedPlanState) {
    const currentStep = resumedPlanState.steps[resumedPlanState.currentStepIndex]
    if (!currentStep) {
      throw new AbortPlanError('No active step found. Do not retry plan.')
    }
    return {
      planId: resumedPlanState.planId,
      steps: resumedPlanState.steps,
      currentStepIndex: resumedPlanState.currentStepIndex,
      inputChainId: resumedPlanState.inputChainId,
      currentStep,
      wasPlanResumed: true,
    }
  }

  // Case 2: Using a plan that was pre-fetched, rather than creating a new plan.
  const prefetchedResponse = yield* call(consumePrefetchedPlan, params.trade)
  if (prefetchedResponse) {
    try {
      const transformedResponse = transformPlanResponse(prefetchedResponse)
      updateGlobalPlanState({ activePlan: transformedResponse, originalResponse: prefetchedResponse })
      return { ...transformedResponse, response: prefetchedResponse, wasPlanResumed: false }
    } catch (error) {
      logger.warn('planSagaUtils', 'initializePlan', 'Prefetched plan unusable, creating fresh', {
        error: error instanceof Error ? error.message : String(error),
      })
      // Fall through to normal createOrRefreshPlan
    }
  }

  // Case 3: No fetch is in-flight, no plan is active in the store to resume; create a new plan.
  try {
    const { response, modalClosed } = yield* race({
      response: call(createOrRefreshPlan, {
        quote,
        routing,
        walletExecutionContext,
        retryConfig: { maxAttempts: 3 },
      }),
      modalClosed: take(signalSwapModalClosed.type),
    })

    if (modalClosed || !response) {
      throw new ExpectedPlanError('Modal closed during plan creation')
    }

    const transformedResponse = transformPlanResponse(response)
    updateGlobalPlanState({ activePlan: transformedResponse, originalResponse: response })

    return { ...transformedResponse, response, wasPlanResumed: false }
  } catch (error) {
    resetActivePlan()
    if (error instanceof AbortPlanError || error instanceof PlanValidationError || error instanceof ExpectedPlanError) {
      throw error
    }
    throw new PlanValidationError('Unexpected error when initializing plan', error)
  }
}

const MAX_ERROR_CAUSES_DEPTH = 10

/** Recursively collects all error.cause values into an array (Error message or JSON string). */
function getErrorCauses(error: unknown): string[] {
  const causes: string[] = []
  let current: unknown = error instanceof Error ? error.cause : undefined
  while (current !== undefined && current !== null && causes.length < MAX_ERROR_CAUSES_DEPTH) {
    if (current instanceof Error) {
      causes.push(current.message)
      current = current.cause
    } else {
      try {
        causes.push(JSON.stringify(current))
      } catch {
        causes.push(String(current))
      }
      break
    }
  }
  return causes
}

export function logHelper(params: {
  timeToCreatePlan?: number
  timeToCompletePlan?: number
  response?: TradingApi.PlanResponse
  planId: string
  steps?: TransactionAndPlanStep[]
  swapTxContext: ValidatedChainedSwapTxAndGasInfo
  error?: Error | unknown
  wasPlanResumed?: boolean
  failurePhase?: 'init' | 'execution'
  args?: Record<string, unknown>
}): void {
  try {
    const {
      timeToCreatePlan = -1,
      timeToCompletePlan = -1,
      response,
      planId,
      steps,
      swapTxContext,
      error,
      args,
      wasPlanResumed,
      failurePhase,
    } = params
    const stepLogArray = getStepLogArray(steps ?? [])
    const content: Record<string, unknown> = {
      timeToCreatePlan: timeToCreatePlan.toString(),
      timeToCompletePlan: timeToCompletePlan.toString(),
      numSteps: steps?.length.toString() ?? '0',
      currentStepIndex: response?.currentStepIndex.toString() ?? '0',
      chainIn: swapTxContext.trade.quote.quote.tokenInChainId.toString(),
      chainOut: swapTxContext.trade.quote.quote.tokenOutChainId.toString(),
      planId,
      quoteId: swapTxContext.trade.quote.quote.quoteId,
      stepLogArray,
      wasPlanResumed,
      failurePhase,
      ...(args ?? {}),
    }
    if (!isProdEnv()) {
      content['quote'] = JSON.stringify(swapTxContext.trade.quote.quote)
      content['initialPlan'] = JSON.stringify(response)
    }
    if (error) {
      content['error'] = error instanceof Error ? error.message : JSON.stringify(error)
      content['errorCauses'] = getErrorCauses(error)
      logger.warn('planSaga', 'plan', 'plan errored', content)
    } else {
      logger.info('planSaga', 'plan', 'plan completed', content)
    }
  } catch (error) {
    logger.error(
      new Error('Error when trying to log. Skipping log since its not critical to the plan saga', { cause: error }),
      { tags: { file: 'planSaga', function: 'logHelper' } },
    )
  }
}

export function updateGlobalPlanState({
  activePlan,
  originalResponse,
}: {
  activePlan: FetchAndTransformPlanResult
  originalResponse: PlanResponse
}): void {
  const planData = {
    response: originalResponse,
    planId: activePlan.planId,
    steps: activePlan.steps,
    proofPending: false,
    currentStepIndex: activePlan.currentStepIndex,
    inputChainId: activePlan.inputChainId,
  }

  activePlanStore.setState({
    activePlan: planData,
  })
}

export function updateGlobalStateWithLatestSteps(params: {
  steps: TransactionAndPlanStep[]
  currentStepIndex: number
  proofPending: boolean
}): void {
  activePlanStore.setState(({ activePlan }) => ({
    activePlan: activePlan ? { ...activePlan, ...params } : undefined,
  }))
}

export function updateGlobalStateProofPending({ accepted }: { accepted: boolean }): void {
  if (accepted) {
    activePlanStore.setState(({ activePlan }) => ({
      activePlan: activePlan ? { ...activePlan, proofPending: true } : undefined,
    }))
  }
}

export function resetActivePlan(): void {
  activePlanStore.getState().actions.resetActivePlan()
}

/**
 * Claims the execution lock for a specific planId. While locked, `ActivePlanUpdater` polling
 * is suppressed to prevent stale API responses from overwriting the calldata the saga is
 * actively using.
 */
export function lockPlanForExecution(planId: string): void {
  activePlanStore.getState().actions.lockPlanForExecution(planId)
}

/**
 * Releases the execution lock **only if the calling planId still holds it**. This conditional
 * check is the key to concurrency safety — on mobile/extension, multiple plan sagas can run
 * in parallel (`takeEvery`), and a backgrounded Plan A's `finally` block must not clear
 * Plan B's lock.
 */
export function unlockPlanExecution(planId: string): void {
  activePlanStore.getState().actions.unlockPlanForExecution(planId)
}

export function backgroundPlan(planId: string): void {
  activePlanStore.getState().actions.backgroundPlan(planId)
}

export function clearPlan(planId: string): void {
  activePlanStore.getState().actions.clearPlan(planId)
}

/**
 * Checks if a plan is currently backgrounded (not the active foreground plan).
 */
export function isPlanBackgrounded(planId: string): boolean {
  return activePlanStore.getState().backgroundedPlans[planId] !== undefined
}

/**
 * Checks if a plan has been cancelled by the user.
 * Used by the plan saga to stop execution when user cancels from activity history.
 */
export function isPlanCancelledCheck(planId: string): boolean {
  return activePlanStore.getState().actions.isPlanCancelled(planId)
}

/**
 * Waits for any ongoing ActivePlanUpdater refresh to finish, then returns the active plan.
 * Resolves to undefined if there is no active plan or the refresh fails.
 */
export function getOrAwaitLatestActivePlan(): Promise<ActivePlanData | undefined> {
  return activePlanStore.getState().actions.getOrAwaitLatestActivePlan()
}

/**
 * Marks a plan as interrupted due to a price change (>1% movement).
 * Called before throwing PlanPriceChangeInterrupt so the UI can show a specific warning.
 */
export function markPlanPriceChangeInterrupted(planId: string): void {
  activePlanStore.getState().actions.markPlanPriceChangeInterrupted(planId)
}

/**
 * Watches for the signalSwapModalClosed action and shows a SwapPending toast
 * if the modal is closed while the plan is executing.
 */
export function* showPendingOnEarlyModalClose(params: {
  sendToast: PlanParams['sendToast']
  planId: string
  onClose: () => void
}): SagaGenerator<void> {
  const { sendToast, planId, onClose } = params
  yield* take(signalSwapModalClosed.type)
  yield* call(onClose)
  backgroundPlan(planId)
  yield* call(
    sendToast,
    {
      type: AppNotificationType.SwapPending,
      wrapType: WrapType.NotApplicable,
    } satisfies SwapPendingNotification,
    planId,
  )
}

/**
 * Constructs a ChainedActionTrade from a PlanResponse using the original trade's currency data.
 * Used to compare the refreshed plan price against the original trade for price change detection.
 */
export function buildTradeFromPlanResponse({
  originalTrade,
  planResponse,
  address,
}: {
  originalTrade: ChainedActionTrade
  planResponse: TradingApi.PlanResponse
  address: Address
}): ChainedActionTrade {
  const quote = originalTrade.quote.quote
  const validatedInput: ValidatedTradeInput = {
    currencyIn: originalTrade.inputAmount.currency,
    currencyOut: originalTrade.outputAmount.currency,
    amount: originalTrade.inputAmount,
    requestTradeType: quote.tradeType,
    activeAccountAddress: address,
    tokenInChainId: quote.tokenInChainId,
    tokenOutChainId: quote.tokenOutChainId,
    tokenInAddress: quote.input.token ?? '',
    tokenOutAddress: quote.output.token ?? '',
  }
  const slippageTolerance = getPlanCompoundSlippageTolerance(planResponse.steps) ?? originalTrade.slippageTolerance
  const adaptedQuote = transformPlanResponseToChainedQuote({
    planResponse,
    validatedInput,
    slippageTolerance,
  } satisfies TransformPlanParams)
  return new ChainedActionTrade({
    quote: adaptedQuote,
    currencyIn: validatedInput.currencyIn,
    currencyOut: validatedInput.currencyOut,
  })
}

export function getWalletExecutionContext(
  walletExecutionContext: CAIP25Session | undefined,
): TradingApi.WalletExecutionContext | undefined {
  if (!walletExecutionContext) {
    return undefined
  }

  const scopes = Object.entries(walletExecutionContext.scopes).reduce<WalletExecutionContext['scopes']>(
    (acc, [key, scope]) => {
      if (!scope) {
        return acc
      }

      const { capabilities = {}, accounts, methods, clientContext, chains } = scope

      acc[key] = { accounts, methods, capabilities, clientContext, chains }
      return acc
    },
    {},
  )

  const properties = {
    walletInfo: {
      uuid: walletExecutionContext.properties.walletInfo.uuid,
      name: walletExecutionContext.properties.walletInfo.name,
      rdns: walletExecutionContext.properties.walletInfo.rdns,
    },
  }

  return {
    scopes,
    properties,
  }
}
