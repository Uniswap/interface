import { TradingApi } from '@universe/api'
import { createApprovalTransactionStep } from 'uniswap/src/features/transactions/steps/approve'
import { createPermit2SignatureStep } from 'uniswap/src/features/transactions/steps/permit2Signature'
import { TransactionStep } from 'uniswap/src/features/transactions/steps/types'
import { createUniswapXPlanSignatureStep } from 'uniswap/src/features/transactions/swap/steps/signOrder'
import { createSwapTransactionStep } from 'uniswap/src/features/transactions/swap/steps/swap'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import {
  validatePermitTypeGuard,
  validateTransactionRequestTypeGuard,
} from 'uniswap/src/features/transactions/swap/utils/trade'
import { tradingApiToUniverseChainId } from 'uniswap/src/features/transactions/swap/utils/tradingApi'

const ERC20_APPROVE_TX_PREFIX = '0x095ea7b3'

export type TransactionAndPlanStep = TransactionStep & TradingApi.PlanStep

/**
 * TODO: SWAP-485 handle error states in this function
 */
const TODO_HANDLE_ERROR = undefined

export const transformStep = (step: TradingApi.PlanStep): TransactionAndPlanStep | undefined => {
  switch (step.method) {
    case TradingApi.PlanStepMethod.SIGN_MSG:
      if (!validatePermitTypeGuard(step.payload)) {
        return TODO_HANDLE_ERROR
      }

      if (step.stepSwapType && isUniswapX({ routing: step.stepSwapType })) {
        return createUniswapXPlanSignatureStep(step.payload, step)
      }
      return {
        ...step,
        ...createPermit2SignatureStep(step.payload),
      }
    case TradingApi.PlanStepMethod.SEND_TX:
      if (!validateTransactionRequestTypeGuard(step.payload)) {
        return TODO_HANDLE_ERROR
      }
      if (step.payload.data?.toString().startsWith(ERC20_APPROVE_TX_PREFIX)) {
        const approvalStep = createApprovalTransactionStep({
          txRequest: step.payload,
          amount: step.tokenInAmount ?? '',
          tokenAddress: step.tokenIn ?? '',
          chainId: tradingApiToUniverseChainId(step.tokenInChainId),
        })
        if (!approvalStep) {
          return TODO_HANDLE_ERROR
        }
        return {
          ...step,
          ...approvalStep,
        }
      } else {
        return {
          ...step,
          ...createSwapTransactionStep(step.payload),
        }
      }
    // TODO: SWAP-433 - Handle send smart wallet transactions
    case TradingApi.PlanStepMethod.SEND_CALLS:
    default:
      return TODO_HANDLE_ERROR
  }
}

export const transformSteps = (steps: TradingApi.PlanStep[]): TransactionAndPlanStep[] => {
  return steps
    .map((step): TransactionAndPlanStep | undefined => transformStep(step))
    .filter((step): step is TransactionAndPlanStep => step !== undefined)
}
