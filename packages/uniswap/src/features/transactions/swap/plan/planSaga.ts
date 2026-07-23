/* oxlint-disable max-lines */
import { TradingApi } from '@universe/api'
import ms from 'ms'
import { call, cancel, delay, fork } from 'typed-redux-saga'
import { TradingApiSessionClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiSessionClient'
import {
  mapTAPIPlanStatusToTXStatus,
  mapTAPIPlanStepStatusToTXStatus,
} from 'uniswap/src/features/activity/extract/statusMappers'
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
  TRADE_STEP_TYPES,
  logUniswapXPlanOrderSubmitted,
} from 'uniswap/src/features/transactions/swap/plan/planStepAnalytics'
import { TransactionAndPlanStep } from 'uniswap/src/features/transactions/swap/plan/planStepTransformer'
import {
  AbortPlanError,
  ExpectedPlanError,
  PlanParams,
  PlanPriceChangeInterrupt,
  type PlanFinalizedCallbackParams,
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

function getLastTradeRelevantNonErrorStep(steps: TransactionAndPlanStep[]): TransactionAndPlanStep | undefined {
  return [...steps]
    .filter((step) => TRADE_STEP_TYPES.has(step.type))
    .filter((step) => step.status !== TradingApi.PlanStepStatus.STEP_ERROR)
    .sort((a, b) => a.stepIndex - b.stepIndex)
    .at(-1)
}

/**
 * Finds a step by the Trading API `stepIndex` value. Plan arrays can retain
 * retry/error rows, so array position is not a stable step identity.
 */
function getStepBySemanticIndex(
  steps: TransactionAndPlanStep[],
  stepIndex: number,
): TransactionAndPlanStep | undefined {
  return steps.find((step) => step.stepIndex === stepIndex)
}

function buildAnalyticsWithPlanStepContext(params: {
  analytics: PlanSagaAnalytics
  planId: string
  currentStep: TransactionAndPlanStep | undefined
  steps: TransactionAndPlanStep[]
  stepRouting: PlanSagaAnalytics['step_routing']
}): PlanSagaAnalytics {
  const { analytics, planId, currentStep, steps, stepRouting } = params
  const lastTradeRelevantStep = getLastTradeRelevantNonErrorStep(steps)

  return {
    ...analytics,
    routing: stepRouting ?? analytics.routing,
    plan_id: planId,
    step_index: currentStep?.stepIndex,
    is_final_step: currentStep?.stepIndex === lastTradeRelevantStep?.stepIndex,
    total_steps: steps.length,
    total_non_error_steps: steps.filter((step) => step.status !== TradingApi.PlanStepStatus.STEP_ERROR).length,
    step_type: currentStep?.type,
    step_routing: stepRouting,
  }
}

function getPlanFinalizedStatus({
  planResponse,
  stepStatus,
}: {
  planResponse?: TradingApi.PlanResponse
  stepStatus?: TradingApi.PlanStepStatus
}): TransactionStatus | undefined {
  if (planResponse?.status) {
    return mapTAPIPlanStatusToTXStatus(planResponse.status)
  }

  if (stepStatus) {
    return mapTAPIPlanStepStatusToTXStatus(stepStatus)
  }

  return undefined
}

function isTerminalPlanStepStatus(
  stepStatus: TradingApi.PlanStepStatus | undefined,
): stepStatus is TradingApi.PlanStepStatus.COMPLETE | TradingApi.PlanStepStatus.STEP_ERROR {
  return stepStatus === TradingApi.PlanStepStatus.COMPLETE || stepStatus === TradingApi.PlanStepStatus.STEP_ERROR
}

function getWatchedLastStepFinalizedStatus({
  planResponse,
  stepStatus,
}: {
  planResponse?: TradingApi.PlanResponse
  stepStatus?: TradingApi.PlanStepStatus
}): TransactionStatus | undefined {
  // Prefer a terminal step status over the plan status because the plan response
  // can lag behind the just-watched step during finalization.
  if (isTerminalPlanStepStatus(stepStatus)) {
    return mapTAPIPlanStepStatusToTXStatus(stepStatus)
  }

  return getPlanFinalizedStatus({ planResponse, stepStatus })
}

function omitPayloadGasFee(payload: TradingApi.PlanStep['payload']): TradingApi.PlanStep['payload'] {
  const { gasFee: _omittedGasFee, ...rest } = payload
  return rest
}

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
// oxlint-disable-next-line complexity typescript/explicit-function-return-type
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
    handleSwapTransactionWalletCallStep,
    handleSignatureStep,
    handleUniswapXPlanSignatureStep,
    getDisplayableError,
    sendToast,
    onPlanFinalized,
    caip25Info,
  } = params

  const startTime = Date.now()
  logger.debug('planSaga', 'plan', '🚨 plan saga started', swapTxContext)

  if (!isChained(swapTxContext)) {
    onFailure(new AbortPlanError('Route not enabled for the plan saga'))
    return
  }

  const { trade } = swapTxContext
  const modalClosedActionType = params.modalClosedActionType

  let planId: string | undefined
  let response: TradingApi.PlanResponse | undefined
  let wasPlanResumed = false
  let steps: TransactionAndPlanStep[]
  // oxlint-disable-next-line prefer-const -- biome-parity: oxlint is stricter here
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
      modalClosedActionType,
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
      const refreshedTrade = buildTradeFromPlanResponse({
        originalTrade: trade,
        planResponse: response,
        address,
      })
      // Earn plans interrupt too: the swap review screen recovers via the accept-new-trade prompt,
      // and the earn review modals convert the interrupt into a displayable "review again" error
      // via their getDisplayableError wrappers (see useEarnSagaCallback / useEarnExecuteCallback).
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
    logHelper({
      planId: planId ?? 'notCreated',
      response,
      swapTxContext,
      error,
      wasPlanResumed,
      failurePhase: 'init',
    })
    return
  }

  timeToCreatePlan = response ? Date.now() - startTime : undefined
  const earlyCloseTask = yield* fork(showPendingOnEarlyModalClose, {
    sendToast,
    planId,
    onClose: onSuccess,
    modalClosedActionType,
  })

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
      let patchResponse: TradingApi.PlanResponse | undefined

      // TODO: API-1530 should be fixed by now, if not request removal.
      // Drop the API-provided per-step gasFee. Built as a copy (rather than `delete` on the
      // stored step) because `steps` is shared with the active-plan store.
      const storedStep = steps[currentStepIndex]
      currentStep = storedStep ? { ...storedStep, payload: omitPayloadGasFee(storedStep.payload) } : undefined

      logger.debug('planSaga', 'plan', '🚨 Starting step', currentStep)

      const swapChainId = currentStep?.tokenInChainId
      if (swapChainId) {
        const chainSwitched = yield* call(selectChain, swapChainId)
        if (!chainSwitched) {
          throw new HandledTransactionInterrupt('Chain switch failed')
        }
      }

      // Compute per-step routing from the step's stepType (e.g., CLASSIC, BRIDGE, DUTCH_V3)
      const stepRouting = currentStep?.stepType
        ? tradeRoutingToFillType({
            routing: planStepTypeToTradingRoute(currentStep.stepType),
            indicative: false,
          })
        : undefined

      // Augment analytics with plan context for chained actions
      const analyticsWithPlanStepContext = buildAnalyticsWithPlanStepContext({
        analytics,
        planId,
        currentStep,
        steps,
        stepRouting,
      })
      const isLastStep = analyticsWithPlanStepContext.is_final_step === true

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
        case TransactionStepType.SwapTransactionWalletCall: {
          requireRouting(trade, [TradingApi.Routing.CHAINED])

          const batchResult = yield* call(handleSwapTransactionWalletCallStep, {
            address,
            step: currentStep,
            setCurrentStep: updateGlobalStateProofPending,
            trade,
            analytics: analyticsWithPlanStepContext,
            planId,
            disableOneClickSwap: () => {},
          })
          if (!batchResult.hash) {
            throw new ShouldRetryPlanError('WalletCall swap failed')
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
        patchResponse = yield* call(() =>
          retryWithBackoff({
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
          }),
        )

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
          onPlanFinalized,
          sendToast,
          startTime,
          timeToCreatePlan,
          response,
          patchResponse,
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
        initialPlanResponse: patchResponse,
      })
      logger.debug('planSaga', 'plan', '🚨 updated steps', updatedSteps)
      response = latestPlanResponse

      // Re-find the executed step by Trading API `stepIndex`; retry/error rows can
      // remain in the plan and shift array positions after watchPlanStep returns.
      const executedUpdatedStep = getStepBySemanticIndex(updatedSteps, currentStep.stepIndex)
      if (!executedUpdatedStep) {
        logger.error(new Error('Unable to find executed step by semantic step index after watchPlanStep'), {
          tags: { file: 'planSaga', function: 'plan' },
          extra: {
            planId,
            semanticStepIndex: currentStep.stepIndex,
            updatedStepIndices: updatedSteps.map((step) => ({
              stepIndex: step.stepIndex,
              status: step.status,
              type: step.type,
            })),
          },
        })
      }
      const stepFailure = executedUpdatedStep?.status === TradingApi.PlanStepStatus.STEP_ERROR
      currentStep = executedUpdatedStep ?? currentStep
      const updatedAnalyticsWithPlanStepContext = buildAnalyticsWithPlanStepContext({
        analytics,
        planId,
        currentStep,
        steps: updatedSteps,
        stepRouting,
      })

      // Non-last trade steps are logged here synchronously after `watchPlanStep` returns.
      // Last steps are instead logged inside `watchLastPlanStepWithCleanup` (forked background saga).
      // logPlanStepTradeAnalytics internally skips non-trade steps (approvals, permits).
      const stepChainId = swapChainId ? tradingApiToUniverseChainId(swapChainId) : null
      logPlanStepTradeAnalytics({
        stepType: currentStep.type,
        updatedSteps,
        semanticStepIndex: currentStep.stepIndex,
        hash,
        chainId: stepChainId ?? undefined,
        stepFailure,
        analyticsWithPlanStepContext: updatedAnalyticsWithPlanStepContext,
        errorExtra: {
          planResponse: latestPlanResponse,
          stepIndex: currentStep.stepIndex,
        },
      })

      const nextStep = findFirstActionableStep(updatedSteps)
      if (nextStep.step) {
        steps = updatedSteps
        currentStepIndex = nextStep.index
        if (!isPlanBackgrounded(planId)) {
          updateGlobalStateWithLatestSteps({
            steps,
            currentStepIndex,
            proofPending: false,
          })
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
        // Price-change interrupts retain the active plan so completed steps remain resumable.
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
      logger.error(displayableError, {
        tags: { file: 'planSaga', function: 'plan' },
      })
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

      if (!isPlanBackgrounded(planId)) {
        const finalizedStatus = getWatchedLastStepFinalizedStatus({
          planResponse: response,
          stepStatus: currentStep?.status,
        })
        onPlanFinalized?.({
          planId,
          // This finally only handles non-completion exits. The completed last-step path
          // backgrounds the plan first, so a COMPLETE step here is only an intermediate step.
          status: finalizedStatus === TransactionStatus.Success ? TransactionStatus.Pending : finalizedStatus,
          planResponse: response,
          stepStatus: currentStep?.status,
        })
      }
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
  onPlanFinalized?: PlanParams['onPlanFinalized']
  sendToast: PlanParams['sendToast']
  startTime: number
  timeToCreatePlan: number | undefined
  response: TradingApi.PlanResponse | undefined
  patchResponse?: TradingApi.PlanResponse
  steps: TransactionAndPlanStep[]
  swapTxContext: ValidatedChainedSwapTxAndGasInfo
  analyticsWithPlanStepContext: PlanSagaAnalytics
  hash: string | undefined
}

type WatchLastPlanStepParams = WatchPlanStepParams & {
  stepType: TransactionStepType
  analyticsWithPlanStepContext: PlanSagaAnalytics
  onPlanFinalized?: PlanParams['onPlanFinalized']
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
    earnAction: params.swapTxContext.trade.earnIntent?.action,
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
// oxlint-disable-next-line typescript/explicit-function-return-type
function* watchLastPlanStepWithCleanup(params: WatchLastPlanStepParams) {
  const {
    stepType,
    analyticsWithPlanStepContext,
    onPlanFinalized,
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

  const errorExtra: Record<string, unknown> = {
    planId: params.planId,
    hash,
    chainId,
  }
  let finalizedPlanResponse: TradingApi.PlanResponse | undefined = response
  let finalizedStepStatus: TradingApi.PlanStepStatus | undefined
  let finalizedStatus: PlanFinalizedCallbackParams['status'] | undefined

  try {
    const { steps: updatedSteps, planResponse: latestPlanResponse } = yield* call(watchPlanStep, watchParams)
    const updatedWatchedStep = getStepBySemanticIndex(updatedSteps, watchParams.targetStepIndex)
    finalizedPlanResponse = latestPlanResponse
    finalizedStepStatus = updatedWatchedStep?.status
    finalizedStatus = getWatchedLastStepFinalizedStatus({
      planResponse: latestPlanResponse,
      stepStatus: finalizedStepStatus,
    })
    if (!updatedWatchedStep) {
      logger.error(new Error('Unable to find watched step by semantic step index after watchPlanStep'), {
        tags: { file: 'planSaga', function: 'watchLastPlanStepWithCleanup' },
        extra: {
          planId: watchParams.planId,
          semanticStepIndex: watchParams.targetStepIndex,
          updatedStepIndices: updatedSteps.map((step) => ({
            stepIndex: step.stepIndex,
            status: step.status,
            type: step.type,
          })),
        },
      })
    }
    const updatedAnalyticsWithPlanStepContext = buildAnalyticsWithPlanStepContext({
      analytics: analyticsWithPlanStepContext,
      planId: watchParams.planId,
      currentStep: updatedWatchedStep,
      steps: updatedSteps,
      stepRouting: analyticsWithPlanStepContext.step_routing,
    })

    // watchPlanStep returns for both COMPLETE and STEP_ERROR — check actual status
    const stepFailure = updatedWatchedStep?.status === TradingApi.PlanStepStatus.STEP_ERROR

    logPlanStepTradeAnalytics({
      stepType,
      updatedSteps,
      semanticStepIndex: watchParams.targetStepIndex,
      hash,
      chainId,
      stepFailure,
      analyticsWithPlanStepContext: updatedAnalyticsWithPlanStepContext,
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
    // Watcher errors are not proof of on-chain failure; keep the plan resumable/pollable.
    const isCancellation = error instanceof HandledTransactionInterrupt
    finalizedStatus = isCancellation ? TransactionStatus.Canceled : TransactionStatus.Pending

    if (!isCancellation) {
      yield* call(
        sendToast,
        buildPlanErrorToast({
          planId: params.planId,
          chainId: watchParams.sourceChainId,
          swapTxContext,
        }),
        params.planId,
      )

      logPlanStepTradeAnalytics({
        stepType,
        updatedSteps: undefined,
        semanticStepIndex: watchParams.targetStepIndex,
        hash,
        chainId,
        stepFailure: true,
        analyticsWithPlanStepContext,
        errorExtra,
      })
    }

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
    onPlanFinalized?.({
      planId: params.planId,
      status: finalizedStatus,
      planResponse: finalizedPlanResponse,
      stepStatus: finalizedStepStatus,
    })
  }
}

/**
 * Handles the last step of a plan: forks background polling, signals success,
 * backgrounds the plan, and logs timing.
 */
// oxlint-disable-next-line typescript/explicit-function-return-type
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
    patchResponse,
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
    onPlanFinalized: params.onPlanFinalized,
    sendToast,
    hash,
    chainId: lastStepChainId,
    startTime,
    timeToCreatePlan,
    response,
    steps,
    swapTxContext,
    initialPlanResponse: patchResponse,
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
