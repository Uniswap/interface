import { TradingApi } from '@universe/api'
import { call, delay, retry } from 'typed-redux-saga'
import { TradingApiClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { UnexpectedTransactionStateError } from 'uniswap/src/features/transactions/errors'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { TransactionAndPlanStep, transformSteps } from 'uniswap/src/features/transactions/swap/plan/planStepTransformer'
import { PlanParams } from 'uniswap/src/features/transactions/swap/plan/types'
import {
  createOrRefreshPlan,
  findFirstActionableStep,
  getStepLogArray,
  waitForStepCompletion,
} from 'uniswap/src/features/transactions/swap/plan/utils'
import { ValidatedChainedSwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { isChained, requireRouting } from 'uniswap/src/features/transactions/swap/utils/routing'
import { createSaga } from 'uniswap/src/utils/saga'
import { BackoffStrategy } from 'utilities/src/async/retryWithBackoff'
import { isProdEnv } from 'utilities/src/environment/env'
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
export function* plan(params: PlanParams) {
  const {
    address,
    setCurrentStep,
    setSteps,
    swapTxContext,
    analytics,
    onSuccess,
    onFailure,
    selectChain,
    handleApprovalTransactionStep,
    handleSwapTransactionStep,
    handleSignatureStep,
    handleUniswapXPlanSignatureStep,
    getDisplayableError,
  } = params

  const startTime = Date.now()
  logger.debug('planSaga', 'plan', '🚨 plan saga started', swapTxContext)
  if (!isChained(swapTxContext)) {
    onFailure(new Error('Route not enabled for the plan saga'))
    return
  }

  const { trade, planId: inputPlanId } = swapTxContext

  const response: TradingApi.PlanResponse = yield* call(createOrRefreshPlan, {
    inputPlanId,
    quote: swapTxContext.trade.quote.quote,
    routing: swapTxContext.trade.quote.routing,
    retryConfig: { maxAttempts: 3, backoffStrategy: BackoffStrategy.None },
  })
  const timeToCreatePlan = Date.now() - startTime

  let steps: TransactionAndPlanStep[] = transformSteps(response.steps)
  const planId = response.planId

  let currentStepIndex = steps.findIndex((step) => step.status !== TradingApi.PlanStepStatus.COMPLETE)
  let currentStep = steps[currentStepIndex]
  setSteps(steps)
  if (currentStep) {
    setCurrentStep({ step: currentStep, accepted: false })
  }

  try {
    while (currentStepIndex < steps.length) {
      let signature: string | undefined
      let hash: string | undefined

      currentStep = steps[currentStepIndex]
      const isLastStep = currentStepIndex === steps.length - 1

      logger.debug('planSaga', 'plan', '🚨 Starting step', currentStep)

      const swapChainId = currentStep?.tokenInChainId
      if (swapChainId) {
        yield* call(selectChain, swapChainId)
        // TODO: SWAP-710
        // Temporary workaround to allow the chain to switch since the next step is executed
        // immediately after the chain switch.
        yield* call(delay, ONE_SECOND_MS / 5)
      }

      // TODO: API-1530 should be fixed by now, if not request removal.
      delete currentStep?.payload.gasFee

      switch (currentStep?.type) {
        case TransactionStepType.TokenRevocationTransaction:
        case TransactionStepType.TokenApprovalTransaction: {
          hash = yield* call(handleApprovalTransactionStep, { address, step: currentStep, setCurrentStep })
          break
        }
        case TransactionStepType.UniswapXPlanSignature: {
          signature = yield* call(handleUniswapXPlanSignatureStep, {
            address,
            step: currentStep,
            setCurrentStep,
            analytics,
          })
          break
        }
        case TransactionStepType.Permit2Signature: {
          signature = yield* call(handleSignatureStep, { address, step: currentStep, setCurrentStep })
          setCurrentStep({ step: currentStep, accepted: true })
          break
        }
        case TransactionStepType.SwapTransaction:
        case TransactionStepType.SwapTransactionAsync: {
          requireRouting(trade, [TradingApi.Routing.CLASSIC, TradingApi.Routing.BRIDGE, TradingApi.Routing.CHAINED])

          const augmentedAnalytics = {
            ...analytics,
            // Augment analytics with plan context for chained actions
            plan_id: planId,
            step_index: currentStep.stepIndex,
            is_final_step: isLastStep,
          }

          hash = yield* call(handleSwapTransactionStep, {
            address,
            signature,
            step: currentStep,
            setCurrentStep,
            trade,
            analytics: augmentedAnalytics,
            allowDuplicativeTx: true,
          })
          break
        }
        default: {
          throw new UnexpectedTransactionStateError(`Unexpected step type: ${currentStep?.type}`)
        }
      }

      if (hash || signature) {
        logger.debug('planSaga', 'plan', '🚨 updating existing trade', planId, hash, signature)
        yield* retry(5, ONE_SECOND_MS, TradingApiClient.updateExistingPlan, {
          planId,
          steps: [{ stepIndex: currentStep.stepIndex, proof: { txHash: hash, signature } }],
        })
        // TODO: SWAP-446 address analytics InterfaceEventName.UniswapXOrderSubmitted
      } else {
        throw new Error('No hash or signature found.')
      }

      if (isLastStep) {
        yield* call(onSuccess)
        const timeToCompletePlan = Date.now() - startTime
        logHelper({ timeToCreatePlan, timeToCompletePlan, response, steps, swapTxContext })
        return
      }

      const updatedSteps: TransactionAndPlanStep[] = yield* call(waitForStepCompletion, {
        chainId: swapChainId,
        planId,
        targetStepIndex: currentStep.stepIndex,
        currentStepIndex,
        inputAmount: swapTxContext.trade.inputAmount,
      })
      logger.debug('planSaga', 'plan', '🚨 updated steps', updatedSteps)
      const nextStep = findFirstActionableStep(updatedSteps)
      if (nextStep) {
        steps = updatedSteps
        setSteps(steps)
        setCurrentStep({ step: nextStep, accepted: false })
        currentStepIndex = nextStep.stepIndex
      } else {
        throw new Error('No next step found')
      }
    }
  } catch (error) {
    const displayableError = getDisplayableError({
      error: error instanceof Error ? error : new Error('Unknown error'),
      step: currentStep,
    })
    if (displayableError) {
      logger.error(displayableError, { tags: { file: 'planSaga', function: 'plan' } })
    }
    const onPressRetry = params.getOnPressRetry?.(displayableError)
    onFailure(displayableError, onPressRetry)
    logHelper({ timeToCreatePlan, response, steps, swapTxContext, error })
    return
  }
}

export const planSaga = createSaga(plan, 'planSaga')

function logHelper(params: {
  timeToCreatePlan?: number
  timeToCompletePlan?: number
  response?: TradingApi.PlanResponse
  steps?: TransactionAndPlanStep[]
  swapTxContext: ValidatedChainedSwapTxAndGasInfo
  error?: Error | unknown
  args?: Record<string, unknown>
}) {
  try {
    const { timeToCreatePlan = -1, timeToCompletePlan = -1, response, steps, swapTxContext, error, args } = params
    const stepLogArray = getStepLogArray(steps ?? [])
    const content: Record<string, unknown> = {
      timeToCreatePlan: timeToCreatePlan.toString(),
      timeToCompletePlan: timeToCompletePlan.toString(),
      stepsNumber: steps?.length.toString() ?? '0',
      chainIn: swapTxContext.trade.quote.quote.tokenInChainId.toString(),
      chainOut: swapTxContext.trade.quote.quote.tokenOutChainId.toString(),
      planId: response?.planId,
      quoteId: swapTxContext.trade.quote.quote.quoteId,
      stepLogArray,
      ...(args ?? {}),
    }
    if (!isProdEnv()) {
      content.quote = JSON.stringify(swapTxContext.trade.quote.quote)
      content.initialPlan = JSON.stringify(response)
    }
    if (error) {
      content.error = error instanceof Error ? error.message : JSON.stringify(error)
      logger.warn('planSaga', 'plan', 'plan saga errored', content)
    } else {
      logger.info('planSaga', 'plan', 'plan saga completed', content)
    }
  } catch (error) {
    logger.error(
      new Error('Error when trying to log. Skipping log since its not critical to the plan saga', { cause: error }),
      {
        tags: { file: 'planSaga', function: 'logHelper' },
      },
    )
  }
}
