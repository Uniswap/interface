import { PlanStepStatus, TradingApi } from '@universe/api'
import { call, delay } from 'typed-redux-saga'
import { UnexpectedTransactionStateError } from 'uniswap/src/features/transactions/errors'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { TransactionAndPlanStep, transformSteps } from 'uniswap/src/features/transactions/swap/plan/planStepTransformer'
import { PlanParams } from 'uniswap/src/features/transactions/swap/plan/types'
import {
  createOrRefreshPlan,
  findFirstActionableStep,
  updateExistingPlanWithRetry,
  waitForStepCompletion,
} from 'uniswap/src/features/transactions/swap/plan/utils'
import { isChained, requireRouting } from 'uniswap/src/features/transactions/swap/utils/routing'
import { createSaga } from 'uniswap/src/utils/saga'
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
    account,
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
    getDisplayableError,
  } = params

  logger.debug('planSaga', 'plan', '🚨 plan saga started', swapTxContext)
  if (!isChained(swapTxContext)) {
    onFailure(new Error('Route not enabled for the plan saga'))
    return
  }

  const { trade, planId: inputPlanId } = swapTxContext

  const response = yield* call(createOrRefreshPlan, {
    inputPlanId,
    quote: swapTxContext.trade.quote.quote,
    routing: swapTxContext.trade.quote.routing,
  })

  let steps: TransactionAndPlanStep[] = transformSteps(response.steps, swapTxContext.trade.inputAmount)
  const planId = response.planId

  let currentStepIndex = steps.findIndex((step) => step.status !== PlanStepStatus.COMPLETE)
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

      // TODO: SWAP-458. API-1530 should be fixed by now, if not request removal.
      delete currentStep?.payload.gasFee

      switch (currentStep?.type) {
        case TransactionStepType.TokenRevocationTransaction:
        case TransactionStepType.TokenApprovalTransaction: {
          hash = yield* call(handleApprovalTransactionStep, { account, step: currentStep, setCurrentStep })
          break
        }
        case TransactionStepType.Permit2Signature: {
          signature = yield* call(handleSignatureStep, { account, step: currentStep, setCurrentStep })
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
            account,
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
        yield* call(updateExistingPlanWithRetry, {
          planId,
          steps: [{ stepIndex: currentStep.stepIndex, proof: { txHash: hash, signature } }],
        })
      } else {
        throw new Error('No hash or signature found.')
      }

      if (isLastStep) {
        yield* call(onSuccess)
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
    return
  }
}

export const planSaga = createSaga(plan, 'planSaga')
