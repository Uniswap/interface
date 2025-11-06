import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { PlanResponse, PlanStepStatus, TradingApi } from '@universe/api'
import { call, delay, SagaGenerator } from 'typed-redux-saga'
import { TradingApiClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UnexpectedTransactionStateError } from 'uniswap/src/features/transactions/errors'
import type {
  HandleApprovalStepParams,
  HandleSignatureStepParams,
  HandleSwapStepParams,
} from 'uniswap/src/features/transactions/steps/types'
import { TransactionStep, TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { ExtractedBaseTradeAnalyticsProperties } from 'uniswap/src/features/transactions/swap/analytics'
import { TransactionAndPlanStep, transformSteps } from 'uniswap/src/features/transactions/swap/plan/planStepTransformer'
import { findFirstActionableStep, stepHasFinalized } from 'uniswap/src/features/transactions/swap/plan/utils'
import { SetCurrentStepFn } from 'uniswap/src/features/transactions/swap/types/swapCallback'
import { ValidatedSwapTxContext } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { isChained, requireRouting } from 'uniswap/src/features/transactions/swap/utils/routing'
import { SignerMnemonicAccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'
import { createSaga } from 'uniswap/src/utils/saga'
import { logger } from 'utilities/src/logger/logger'

type SwapParams = {
  selectChain: (chainId: number) => Promise<boolean>
  startChainId?: number
  account: SignerMnemonicAccountDetails
  analytics: ExtractedBaseTradeAnalyticsProperties
  swapTxContext: ValidatedSwapTxContext
  setCurrentStep: SetCurrentStepFn
  setSteps: (steps: TransactionStep[]) => void
  getOnPressRetry: (error: Error | undefined) => (() => void) | undefined
  disableOneClickSwap: () => void
  onSuccess: () => void
  onFailure: (error?: Error, onPressRetry?: () => void) => void
  onTransactionHash?: (hash: string) => void
  v4Enabled: boolean
}

type PlanCalls = {
  handleApprovalTransactionStep: (params: HandleApprovalStepParams) => SagaGenerator<string>
  handleSwapTransactionStep: (params: HandleSwapStepParams) => SagaGenerator<string>
  handleSignatureStep: (params: HandleSignatureStepParams) => SagaGenerator<string>
  getDisplayableError: ({
    error,
    step,
    flow,
  }: {
    error: Error
    step?: TransactionStep
    flow?: string
  }) => Error | undefined
}

const MAX_ATTEMPTS = 60

/**
 * Waits for a the target step to complete by polling the plan for the given planId and targetStepId.
 *
 * @returns The updated steps or no steps
 */
function* waitForStepCompletion(params: {
  chainId: number
  planId: string
  targetStepId: string
  currentStepIndex: number
  inputAmount: CurrencyAmount<Currency>
}): SagaGenerator<TransactionAndPlanStep[]> {
  const { chainId, planId, targetStepId, currentStepIndex, inputAmount } = params

  const pollingInterval = getChainInfo(chainId).tradingApiPollingIntervalMs
  let attempt = 0

  try {
    while (attempt < MAX_ATTEMPTS) {
      logger.debug('planSaga', 'waitForStepCompletion', 'waiting for step completion', {
        currentStepIndex,
        attempt,
        maxAttempts: MAX_ATTEMPTS,
      })

      const tradeStatusResponse = yield* call(TradingApiClient.getExistingPlan, { planId })
      const latestTargetStep = tradeStatusResponse.steps.find((_step) => _step.stepId === targetStepId)
      if (!latestTargetStep) {
        throw new Error(`Target stepId=${targetStepId} not found in latest plan.`)
      }
      if (stepHasFinalized(latestTargetStep)) {
        return transformSteps(tradeStatusResponse.steps, inputAmount)
      }
      attempt++
      yield* delay(pollingInterval)
    }
    throw new Error(`Exceeded ${MAX_ATTEMPTS} attempts waiting for step completion`)
  } catch (error) {
    logger.error(error, { tags: { file: 'planSaga', function: 'waitForStepCompletion' } })
    throw error
  }
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
function* plan(params: SwapParams & PlanCalls) {
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

  let response: PlanResponse
  if (!inputPlanId) {
    // TODO: SWAP-429 - Update to ChainedQuoteResponse is added to the TAPI sdk
    response = yield* call(TradingApiClient.createNewPlan, {
      quote: swapTxContext.trade.quote.quote,
      routing: swapTxContext.trade.quote.routing,
    })
  } else {
    response = yield* call(TradingApiClient.updateExistingPlan, { planId: inputPlanId, steps: [] })
  }
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

      // @ts-expect-error TODO: SWAP-458 - Temporary fix for chainId until fromChainId is finalized
      const swapChainId = currentStep?.chainId || currentStep?.fromChainId || currentStep?.txRequest?.chainId
      if (swapChainId) {
        yield* call(selectChain, swapChainId)
      }

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
          hash = yield* call(handleSwapTransactionStep, {
            account,
            signature,
            step: currentStep,
            setCurrentStep,
            trade,
            analytics,
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
        yield* call(TradingApiClient.updateExistingPlan, {
          planId,
          steps: [{ stepId: currentStep.stepId, proof: { txHash: hash, signature } }],
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
        targetStepId: currentStep.stepId,
        currentStepIndex,
        inputAmount: swapTxContext.trade.inputAmount,
      })
      logger.debug('planSaga', 'plan', '🚨 updated steps', updatedSteps)
      const nextStep = findFirstActionableStep(updatedSteps)
      if (nextStep) {
        steps = updatedSteps
        setSteps(steps)
        setCurrentStep({ step: nextStep, accepted: false })
        currentStepIndex = steps.findIndex((s) => s.stepId === nextStep.stepId)
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
    const onPressRetry = params.getOnPressRetry(displayableError)
    onFailure(displayableError, onPressRetry)
    return
  }
}

export const planSaga = createSaga(plan, 'planSaga')
