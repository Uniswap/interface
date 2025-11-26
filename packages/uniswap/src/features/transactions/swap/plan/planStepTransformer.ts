import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { Method, PlanStep, TradingApi } from '@universe/api'
import { createApprovalTransactionStep } from 'uniswap/src/features/transactions/steps/approve'
import { createPermit2SignatureStep } from 'uniswap/src/features/transactions/steps/permit2Signature'
import { TransactionStep } from 'uniswap/src/features/transactions/steps/types'
import { createUniswapXPlanSignatureStep } from 'uniswap/src/features/transactions/swap/steps/signOrder'
import { createSwapTransactionStep } from 'uniswap/src/features/transactions/swap/steps/swap'
import {
  validatePermitTypeGuard,
  validateTransactionRequestTypeGuard,
} from 'uniswap/src/features/transactions/swap/utils/trade'

const ERC20_APPROVE_TX_PREFIX = '0x095ea7b3'

export type TransactionAndPlanStep = TransactionStep & PlanStep

/**
 * TODO: SWAP-485 handle error states in this function
 */
const TODO_HANDLE_ERROR = undefined

export const transformStep = (
  step: PlanStep,
  inputAmount: CurrencyAmount<Currency>,
): TransactionAndPlanStep | undefined => {
  switch (step.method) {
    case Method.SIGN_MSG:
      if (!validatePermitTypeGuard(step.payload)) {
        return TODO_HANDLE_ERROR
      }

      // TODO: SWAP-458 Add proper types when available
      if (
        step.stepSwapType === TradingApi.Routing.DUTCH_V2 ||
        step.stepSwapType === TradingApi.Routing.DUTCH_V3 ||
        step.stepSwapType === TradingApi.Routing.DUTCH_LIMIT ||
        step.stepSwapType === TradingApi.Routing.PRIORITY
      ) {
        return createUniswapXPlanSignatureStep(step.payload, step)
      }
      return {
        ...step,
        ...createPermit2SignatureStep(step.payload, inputAmount.currency),
      }
    case Method.SEND_TX:
      if (!validateTransactionRequestTypeGuard(step.payload)) {
        return TODO_HANDLE_ERROR
      }
      if (step.payload.data?.toString().startsWith(ERC20_APPROVE_TX_PREFIX)) {
        const approvalStep = createApprovalTransactionStep({
          txRequest: step.payload,
          amountIn: inputAmount,
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
    case Method.SEND_CALLS:
    default:
      return TODO_HANDLE_ERROR
  }
}

export const transformSteps = (steps: PlanStep[], inputAmount: CurrencyAmount<Currency>): TransactionAndPlanStep[] => {
  return steps
    .map((step) => transformStep(step, inputAmount))
    .filter((step): step is TransactionAndPlanStep => step !== undefined)
}
