/* eslint-disable max-lines */
import { TradingApi } from '@universe/api'
import ms from 'ms'
import { call, cancel, delay, fork } from 'typed-redux-saga'
import { TradingApiSessionClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiSessionClient'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { AppNotificationType, type PlanTxNotification } from 'uniswap/src/features/notifications/slice/types'
import { HandledTransactionInterrupt } from 'uniswap/src/features/transactions/errors'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { tradeRoutingToFillType } from 'uniswap/src/features/transactions/swap/analytics'
import {
  backgroundPlan,
  buildTradeFromPlanResponse,
  clearPlan,
  getWalletExecutionContext,
  initializePlan,
  isPlanBackgrounded,
  isPlanCancelledCheck,
  lockPlanForExecution,
  logHelper,
  markPlanPriceChangeInterrupted,
  resetActivePlan,
  showPendingOnEarlyModalClose,
  unlockPlanExecution,
  updateGlobalStateProofPending,
  updateGlobalStateWithLatestSteps,
} from 'uniswap/src/features/transactions/swap/plan/planSagaUtils'
import {
  logPlanStepTradeAnalytics,
  logUniswapXPlanOrderSubmitted,
} from 'uniswap/src/features/transactions/swap/plan/planStepAnalytics'
import { TransactionAndPlanStep } from 'uniswap/src/features/transactions/swap/plan/planStepTransformer'
import {
  AbortPlanError,
  ExpectedPlanError,
  PlanParams,
  PlanPriceChangeInterrupt,
  type PlanSagaAnalytics,
  ShouldRetryPlanError,
} from 'uniswap/src/features/transactions/swap/plan/types'
import { findFirstActionableStep } from 'uniswap/src/features/transactions/swap/plan/utils'
import { WatchPlanStepParams, watchPlanStep } from 'uniswap/src/features/transactions/swap/plan/watchPlanStepSaga'
import { ValidatedChainedSwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import {
  isChained,
  planStepTypeToTradingRoute,
  requireRouting,
} from 'uniswap/src/features/transactions/swap/utils/routing'
import { requireAcceptNewTrade } from 'uniswap/src/features/transactions/swap/utils/trade'
import { tradingApiToUniverseChainId } from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { TransactionStatus, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { createMonitoredSaga } from 'uniswap/src/utils/saga'
import { BackoffStrategy, retryWithBackoff } from 'utilities/src/async/retryWithBackoff'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

/**
 * Saga for executing a plan returned from the Trading API. This plan
 * includes a list of steps to be executed in sequence in order to execute
 * various actions such as a signature, approval, or swap.
 *
 * If a inputTradeId exists, it will use that existing plan and refresh the
 * plan before beginning execution. As steps are executed, the proofs are sent
 * to the TAPI to update the plan. As the steps are executed, the plan continues
 * to execute the next step until all last step is confirmed.
 */
// eslint-disable-next-line complexity
export function* plan(params: PlanParams) {
  const {
    address,
    swapTxContext,
    analytics,
    onSuccess,
    onFailure,
    selectChain,
    handleApprovalTransactionStep,
    handleSwapTransactionStep,
    handleSwapTransactionBatchedStep,
    handleSignatureStep,
    handleUniswapXPlanSignatureStep,
    getDisplayableError,
    sendToast,
    caip25Info,
  } = params

  const startTime = Date.now()
  logger.debug('planSaga', 'plan', '🚨 plan saga started', swapTxContext)

  if (!isChained(swapTxContext)) {
    onFailure(new AbortPlanError('Route not enabled for the plan saga'))
    return
  }

  const { trade } = swapTxContext

  let planId: string | undefined
  let response: TradingApi.PlanResponse | undefined
  let wasPlanResumed = false
  let steps: TransactionAndPlanStep[]
  let timeToCreatePlan: number | undefined
  let currentStepIndex: number
  let currentStep: TransactionAndPlanStep | undefined
  let inputChainId: UniverseChainId | null

  try {
    const initialPlan = yield* call(initializePlan, {
      walletExecutionContext: getWalletExecutionContext(caip25Info),
      quote: swapTxContext.trade.quote.quote,
      routing: swapTxContext.trade.quote.routing,
      trade: swapTxContext.trade,
    })
    planId = initialPlan.planId
    response = initialPlan.response
    wasPlanResumed = initialPlan.wasPlanResumed
    steps = initialPlan.steps
    currentStepIndex = initialPlan.currentStepIndex
    currentStep = initialPlan.currentStep
    inputChainId = initialPlan.inputChainId

    // Suppress ActivePlanUpdater polling so stale API responses don't overwrite our calldata.
    lockPlanForExecution(planId)

    // Check for price changes on the created plan (not resumed)
    if (response && !wasPlanResumed) {
      const refreshedTrade = buildTradeFromPlanResponse({ originalTrade: trade, planResponse: response, address })
      if (requireAcceptNewTrade(trade, refreshedTrade)) {
        markPlanPriceChangeInterrupted(planId)
        resetActivePlan()
        throw new PlanPriceChangeInterrupt()
      }
    }
  } catch (error) {
    if (planId) {
      unlockPlanExecution(planId)
    }
    if (error instanceof ExpectedPlanError) {
      yield* call(onSuccess)
      return
    }
    // @ts-expect-error - TODO: SWAP-485: getDisplayableError needs to be updated to accept unknown errors
    const displayableError = getDisplayableError({ error })
    const onPressRetry = params.getOnPressRetry?.(displayableError)
    onFailure(displayableError, onPressRetry)
    logHelper({ planId: planId ?? 'notCreated', response, swapTxContext, error, wasPlanResumed, failurePhase: 'init' })
    return
  }

  timeToCreatePlan = response ? Date.now() - startTime : undefined
  const earlyCloseTask = yield* fork(showPendingOnEarlyModalClose, { sendToast, planId, onClose: onSuccess })

  /** Only updates UI state if the plan is not backgrounded */
  const setCurrentStepIfActive = (args: { accepted: boolean }): void => {
    if (!isPlanBackgrounded(planId)) {
      updateGlobalStateProofPending(args)
    }
  }

  try {
    while (currentStepIndex < steps.length) {
      // Check if plan was cancelled while backgrounded
      if (isPlanCancelledCheck(planId)) {
        logger.debug('planSaga', 'plan', 'Plan cancelled by user, stopping execution', { planId })
        throw new HandledTransactionInterrupt('Plan cancelled by user')
      }

      let signature: string | undefined
      let hash: string | undefined

      currentStep = steps[currentStepIndex]
      const isLastStep = currentStepIndex === steps.length - 1

      logger.debug('planSaga', 'plan', '🚨 Starting step', currentStep)

      const swapChainId = currentStep?.tokenInChainId
      if (swapChainId) {
        const chainSwitched = yield* call(selectChain, swapChainId)
        if (!chainSwitched) {
          throw new HandledTransactionInterrupt('Chain switch failed')
        }
        // Workaround to allow the chain to switch on an external wallet
        yield* call(delay, ONE_SECOND_MS / 5)
      }

      // TODO: API-1530 should be fixed by now, if not request removal.
      delete currentStep?.payload['gasFee']

      // Compute per-step routing from the step's stepType (e.g., CLASSIC, BRIDGE, DUTCH_V3)
      const stepRouting = currentStep?.stepType
        ? tradeRoutingToFillType({
            routing: planStepTypeToTradingRoute(currentStep.stepType),
            indicative: false,
          })
        : undefined

      // Augment analytics with plan context for chained actions
      const analyticsWithPlanStepContext = {
        ...analytics,
        routing: stepRouting ?? analytics.routing,
        plan_id: planId,
        step_index: currentStep?.stepIndex,
        is_final_step: isLastStep,
        total_steps: steps.length,
        // We filter out error steps that were later retried and a new step was added to the plan
        total_non_error_steps: steps.filter((s) => s.status !== TradingApi.PlanStepStatus.STEP_ERROR).length,
        step_type: currentStep?.type,
        step_routing: stepRouting,
      }

      switch (currentStep?.type) {
        case TransactionStepType.TokenRevocationTransaction:
        case TransactionStepType.TokenApprovalTransaction: {
          hash = yield* call(handleApprovalTransactionStep, {
            address,
            step: currentStep,
            setCurrentStep: setCurrentStepIfActive,
            shouldWaitForConfirmation: false,
            planId,
          })
          break
        }
        case TransactionStepType.UniswapXPlanSignature: {
          signature = yield* call(handleUniswapXPlanSignatureStep, {
            address,
            step: currentStep,
            setCurrentStep: setCurrentStepIfActive,
            analytics: analyticsWithPlanStepContext,
            planId,
          })
          break
        }
        case TransactionStepType.Permit2Signature: {
          signature = yield* call(handleSignatureStep, {
            address,
            step: currentStep,
            setCurrentStep: setCurrentStepIfActive,
            planId,
          })
          setCurrentStepIfActive({ accepted: true })
          break
        }
        case TransactionStepType.SwapTransaction: {
          requireRouting(trade, [TradingApi.Routing.CLASSIC, TradingApi.Routing.BRIDGE, TradingApi.Routing.CHAINED])

          hash = yield* call(handleSwapTransactionStep, {
            address,
            signature,
            step: currentStep,
            setCurrentStep: setCurrentStepIfActive,
            trade,
            analytics: analyticsWithPlanStepContext,
            allowDuplicativeTx: true,
            planId,
          })
          break
        }
        case TransactionStepType.SwapTransactionBatched: {
          requireRouting(trade, [TradingApi.Routing.CHAINED])

          const batchResult = yield* call(handleSwapTransactionBatchedStep, {
            address,
            step: currentStep,
            setCurrentStep: updateGlobalStateProofPending,
            trade,
            analytics: analyticsWithPlanStepContext,
            planId,
            disableOneClickSwap: () => {},
          })
          if (!batchResult.hash) {
            throw new ShouldRetryPlanError('Batched swap failed')
          }
          hash = batchResult.hash
          break
        }
        default: {
          throw new ShouldRetryPlanError(`Unexpected step type: ${currentStep?.type}`)
        }
      }

      if (hash || signature) {
        const stepIndex = currentStep.stepIndex
        logger.debug('planSaga', 'plan', '🚨 updating existing trade', planId, hash, signature)

        const stepChainId = swapChainId ? tradingApiToUniverseChainId(swapChainId) : null
        const blockTimeMs = stepChainId ? getChainInfo(stepChainId).blockTimeMs : undefined
        // We set the base delay to half the block time.
        const baseDelayMs = blockTimeMs ? blockTimeMs / 2 : ONE_SECOND_MS

        // We were often seeing that the first request would fail, so we wait 250ms before the first request to give the API a chance to get up to date data.
        yield* delay(250)

        // We retry up to 10 times with a base delay of half the block time.
        // Mainnet (blockTime 12s) → baseDelay 6s → worst-case total = 54s
        // Unichain (blockTime 1s) → baseDelay 0.5s → worst-case total = 4.75s
        yield* call(retryWithBackoff, {
          fn: async () =>
            TradingApiSessionClient.updateExistingPlan({
              planId,
              steps: [{ stepIndex, proof: { txHash: hash, signature } }],
            }),
          config: {
            maxAttempts: 10,
            baseDelayMs,
            backoffStrategy: BackoffStrategy.None,
          },
        })

        // Log UniswapXOrderSubmitted after signature is successfully submitted to TAPI
        if (currentStep.type === TransactionStepType.UniswapXPlanSignature) {
          logUniswapXPlanOrderSubmitted({ analyticsWithPlanStepContext })
        }
      } else {
        throw new AbortPlanError('No hash or signature found. Do not retry plan.')
      }

      if (isLastStep) {
        yield* call(handleLastStepCompletion, {
          planId,
          currentStep,
          inputChainId,
          address,
          onSuccess,
          sendToast,
          startTime,
          timeToCreatePlan,
          response,
          steps,
          swapTxContext,
          analyticsWithPlanStepContext,
          hash,
        })
        return
      }

      const { steps: updatedSteps, planResponse: latestPlanResponse } = yield* call(watchPlanStep, {
        planId,
        targetStepIndex: currentStep.stepIndex,
        stepChainId: tradingApiToUniverseChainId(swapChainId),
        sourceChainId: inputChainId,
        address,
      })
      logger.debug('planSaga', 'plan', '🚨 updated steps', updatedSteps)
      response = latestPlanResponse

      const stepFailure = updatedSteps[currentStepIndex]?.status === TradingApi.PlanStepStatus.STEP_ERROR

      // Non-last trade steps are logged here synchronously after `watchPlanStep` returns.
      // Last steps are instead logged inside `watchLastPlanStepWithCleanup` (forked background saga).
      // logPlanStepTradeAnalytics internally skips non-trade steps (approvals, permits).
      const stepChainId = swapChainId ? tradingApiToUniverseChainId(swapChainId) : null
      logPlanStepTradeAnalytics({
        stepType: currentStep.type,
        updatedSteps,
        stepIndex: currentStepIndex,
        hash,
        chainId: stepChainId ?? undefined,
        stepFailure,
        analyticsWithPlanStepContext,
        errorExtra: { planResponse: latestPlanResponse, stepIndex: currentStep.stepIndex },
      })

      const nextStep = findFirstActionableStep(updatedSteps)
      if (nextStep.step) {
        steps = updatedSteps
        currentStepIndex = nextStep.index
        if (!isPlanBackgrounded(planId)) {
          updateGlobalStateWithLatestSteps({ steps, currentStepIndex, proofPending: false })
        }

        if (stepFailure) {
          logger.debug('planSaga', 'plan', '🚨 step failed')
          throw new HandledTransactionInterrupt(`Plan step failed`)
        }

        // Check for price changes before executing the next step
        const refreshedTrade = buildTradeFromPlanResponse({
          originalTrade: trade,
          planResponse: latestPlanResponse,
          address,
        })
        if (requireAcceptNewTrade(trade, refreshedTrade)) {
          markPlanPriceChangeInterrupted(planId)
          throw new PlanPriceChangeInterrupt()
        }
      } else {
        throw new ShouldRetryPlanError(`No next step found`)
      }
    }
  } catch (error) {
    const displayableError = getDisplayableError({
      // @ts-expect-error - TODO: SWAP-485: getDisplayableError needs to be updated to accept unknown errors
      error,
      step: currentStep,
    })
    if (displayableError) {
      logger.error(displayableError, { tags: { file: 'planSaga', function: 'plan' } })
    }
    const onPressRetry = params.getOnPressRetry?.(displayableError)

    // Clear the active plan if a step has not been completed.
    if (currentStepIndex === 0) {
      resetActivePlan()
    }

    // Notify and clear backgrounded plan on error
    if (isPlanBackgrounded(planId)) {
      yield* call(sendToast, buildPlanErrorToast({ planId, chainId: inputChainId, swapTxContext }), planId)
      clearPlan(planId)
    }

    onFailure(displayableError, onPressRetry)
    logHelper({
      planId,
      timeToCreatePlan,
      response,
      steps,
      swapTxContext,
      error,
      wasPlanResumed,
      failurePhase: 'execution',
    })
    return
  } finally {
    // Always release the execution lock so ActivePlanUpdater polling can resume.
    // The `if (planId)` guard handles the case where `initializePlan` failed before assigning planId.
    if (planId) {
      unlockPlanExecution(planId)
    }
    yield* cancel(earlyCloseTask)
  }
}

interface HandleLastStepCompletionParams {
  planId: string
  currentStep: TransactionAndPlanStep
  inputChainId: UniverseChainId
  address: Address
  onSuccess: () => void
  sendToast: PlanParams['sendToast']
  startTime: number
  timeToCreatePlan: number | undefined
  response: TradingApi.PlanResponse | undefined
  steps: TransactionAndPlanStep[]
  swapTxContext: ValidatedChainedSwapTxAndGasInfo
  analyticsWithPlanStepContext: PlanSagaAnalytics
  hash: string | undefined
}

type WatchLastPlanStepParams = WatchPlanStepParams & {
  stepType: TransactionStepType
  analyticsWithPlanStepContext: PlanSagaAnalytics
  sendToast: PlanParams['sendToast']
  hash: string | undefined
  chainId: number | undefined
  startTime: number
  timeToCreatePlan: number | undefined
  response: TradingApi.PlanResponse | undefined
  steps: TransactionAndPlanStep[]
  swapTxContext: ValidatedChainedSwapTxAndGasInfo
}

function buildPlanErrorToast(params: {
  planId: string
  chainId: UniverseChainId | null
  swapTxContext: ValidatedChainedSwapTxAndGasInfo
}): PlanTxNotification {
  return {
    type: AppNotificationType.Transaction,
    txType: TransactionType.Plan,
    txStatus: TransactionStatus.AwaitingAction,
    txId: params.planId,
    chainId: params.chainId as UniverseChainId,
    inputCurrencyId: currencyId(params.swapTxContext.trade.inputAmount.currency),
    outputCurrencyId: currencyId(params.swapTxContext.trade.outputAmount.currency),
    inputCurrencyAmountRaw: params.swapTxContext.trade.inputAmount.quotient.toString(),
    outputCurrencyAmountRaw: params.swapTxContext.trade.outputAmount.quotient.toString(),
  }
}

/**
 * Wraps watchPlanStep in try/catch/finally for the last step.
 * Unlike non-last steps (which use a blocking `call`), errors from a forked task
 * won't be caught by the parent saga's try/catch since it has already returned.
 * - catch: prevents unhandled errors from the forked polling task
 * - finally: clears the plan from backgroundedPlans so the activity UI can show
 *   the real plan status (e.g. AwaitingAction) instead of overriding it to Pending,
 *   which is what allows the retry button to appear for failed last steps.
 */
function* watchLastPlanStepWithCleanup(params: WatchLastPlanStepParams) {
  const {
    stepType,
    analyticsWithPlanStepContext,
    sendToast,
    hash,
    chainId,
    startTime,
    timeToCreatePlan,
    response,
    steps,
    swapTxContext,
    ...watchParams
  } = params

  const errorExtra: Record<string, unknown> = { planId: params.planId, hash, chainId }

  try {
    const { steps: updatedSteps, planResponse: latestPlanResponse } = yield* call(watchPlanStep, watchParams)

    // watchPlanStep returns for both COMPLETE and STEP_ERROR — check actual status
    const stepFailure = updatedSteps[watchParams.targetStepIndex]?.status === TradingApi.PlanStepStatus.STEP_ERROR

    logPlanStepTradeAnalytics({
      stepType,
      updatedSteps,
      stepIndex: watchParams.targetStepIndex,
      hash,
      chainId,
      stepFailure,
      analyticsWithPlanStepContext,
      errorExtra,
    })

    const timeToCompletePlan = Date.now() - startTime
    logHelper({
      planId: watchParams.planId,
      timeToCreatePlan,
      timeToCompletePlan,
      response: latestPlanResponse,
      steps,
      swapTxContext,
    })
  } catch (error) {
    yield* call(
      sendToast,
      buildPlanErrorToast({ planId: params.planId, chainId: watchParams.sourceChainId, swapTxContext }),
      params.planId,
    )

    logPlanStepTradeAnalytics({
      stepType,
      updatedSteps: undefined,
      stepIndex: watchParams.targetStepIndex,
      hash,
      chainId,
      stepFailure: true,
      analyticsWithPlanStepContext,
      errorExtra,
    })

    logHelper({
      planId: watchParams.planId,
      timeToCreatePlan,
      response,
      steps,
      swapTxContext,
      error,
      failurePhase: 'execution',
    })
  } finally {
    // Once polling completes (success or failure), remove the plan from backgroundedPlans.
    // This is critical: withDisplayStatusForTrackedPlans in useMergeLocalAndRemoteTransactions
    // overrides AwaitingAction → Pending for any plan in backgroundedPlans, which suppresses
    // the retry button. Clearing the plan here lets the actual status flow through to the UI.
    if (isPlanBackgrounded(params.planId)) {
      clearPlan(params.planId)
    }
  }
}

/**
 * Handles the last step of a plan: forks background polling, signals success,
 * backgrounds the plan, and logs timing.
 */
function* handleLastStepCompletion(params: HandleLastStepCompletionParams) {
  const {
    planId,
    currentStep,
    inputChainId,
    address,
    onSuccess,
    sendToast,
    startTime,
    timeToCreatePlan,
    response,
    steps,
    swapTxContext,
    analyticsWithPlanStepContext,
    hash,
  } = params
  const lastStepIndex = currentStep.stepIndex
  const lastStepChainId = tradingApiToUniverseChainId(currentStep.tokenInChainId)

  if (!lastStepChainId) {
    logger.error(new Error('Missing lastStepChainId for last plan step analytics'), {
      tags: { file: 'planSaga', function: 'handleLastStepCompletion' },
      extra: { planId, stepIndex: lastStepIndex },
    })
  }

  // For the last step, we fork watchPlanStep (non-blocking) so the saga can return
  // and let the user navigate away while polling continues in the background.
  yield* fork(watchLastPlanStepWithCleanup, {
    planId,
    targetStepIndex: lastStepIndex,
    stepChainId: lastStepChainId,
    sourceChainId: inputChainId,
    address,
    stepType: currentStep.type,
    analyticsWithPlanStepContext,
    sendToast,
    hash,
    chainId: lastStepChainId,
    startTime,
    timeToCreatePlan,
    response,
    steps,
    swapTxContext,
  })

  // Signal success to the swap modal and background the plan so the user can navigate away.
  if (!isPlanBackgrounded(planId)) {
    yield* call(onSuccess)
    backgroundPlan(planId)
  }
}

export const {
  name: planSagaName,
  wrappedSaga: planWrappedSaga,
  reducer: planReducer,
  actions: planActions,
} = createMonitoredSaga({
  saga: plan,
  name: 'planSaga',
  options: { timeoutDuration: ms('30m'), showErrorNotification: false },
})
