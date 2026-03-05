import { TradingApi } from '@universe/api'
import { createApprovalTransactionStep } from 'uniswap/src/features/transactions/steps/approve'
import { createPermit2SignatureStep } from 'uniswap/src/features/transactions/steps/permit2Signature'
import { TransactionStep } from 'uniswap/src/features/transactions/steps/types'
import { PlanValidationError } from 'uniswap/src/features/transactions/swap/plan/types'
import { parseSendCallsPlanStepPayload } from 'uniswap/src/features/transactions/swap/plan/utils'
import { createUniswapXPlanSignatureStep } from 'uniswap/src/features/transactions/swap/steps/signOrder'
import {
  createSwapTransactionStep,
  createSwapTransactionStepBatched,
} from 'uniswap/src/features/transactions/swap/steps/swap'
import { isUniswapX, planStepTypeToTradingRoute } from 'uniswap/src/features/transactions/swap/utils/routing'
import { validatePermitTypeGuard, validateTransactionRequest } from 'uniswap/src/features/transactions/swap/utils/trade'
import { tradingApiToUniverseChainId } from 'uniswap/src/features/transactions/swap/utils/tradingApi'

const ERC20_APPROVE_TX_PREFIX = '0x095ea7b3'

export type TransactionAndPlanStep = TransactionStep & TradingApi.PlanStep

export const transformStep = (step: TradingApi.PlanStep): TransactionAndPlanStep => {
  try {
    switch (step.method) {
      case TradingApi.PlanStepMethod.SIGN_MSG: {
        if (!validatePermitTypeGuard(step.payload)) {
          throw new PlanValidationError('Invalid permit type guard')
        }
        if (step.stepType && isUniswapX({ routing: planStepTypeToTradingRoute(step.stepType) })) {
          return createUniswapXPlanSignatureStep(step.payload, step)
        }
        return {
          ...step,
          ...createPermit2SignatureStep(step.payload),
        }
      }
      case TradingApi.PlanStepMethod.SEND_TX: {
        const txRequest = validateTransactionRequest(step.payload)
        if (!txRequest) {
          throw new PlanValidationError('Invalid transaction request type guard')
        }
        if (txRequest.data?.toString().startsWith(ERC20_APPROVE_TX_PREFIX)) {
          const approvalStep = createApprovalTransactionStep({
            txRequest,
            amount: step.tokenInAmount ?? '',
            tokenAddress: step.tokenIn ?? '',
            chainId: tradingApiToUniverseChainId(step.tokenInChainId),
          })
          if (!approvalStep) {
            throw new PlanValidationError('Invalid approval step')
          }
          return {
            ...step,
            ...approvalStep,
          }
        }

        return {
          ...step,
          ...createSwapTransactionStep(txRequest),
        }
      }
      // TODO: SWAP-433 - Handle send smart wallet transactions
      case TradingApi.PlanStepMethod.SEND_CALLS: {
        const transactionRequests = parseSendCallsPlanStepPayload(step.payload)
        if (!transactionRequests) {
          throw new PlanValidationError('Invalid transaction request type guard')
        }
        const firstStep = transactionRequests[0]
        const isSingleStep = transactionRequests.length === 1 && firstStep

        return {
          ...step,
          ...(isSingleStep
            ? createSwapTransactionStep(firstStep)
            : createSwapTransactionStepBatched(transactionRequests)),
        }
      }
      default:
        throw new PlanValidationError('Invalid method')
    }
  } catch (error) {
    if (error instanceof PlanValidationError) {
      throw error
    }
    throw new PlanValidationError(`Unknown error when transforming step (method: ${step.method})`, error)
  }
}

/**
 * Takes in a list of TAPI Plan Steps and transforms them into a list of TransactionAndPlanSteps.
 *
 * @throws PlanValidationError if any of the steps are invalid.
 */
export const transformSteps = (steps: TradingApi.PlanStep[]): TransactionAndPlanStep[] => {
  return steps.map((step): TransactionAndPlanStep => transformStep(step))
}
