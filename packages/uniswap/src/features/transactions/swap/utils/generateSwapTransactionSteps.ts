import { createApprovalTransactionStep } from 'uniswap/src/features/transactions/steps/approve'
import { createPermit2SignatureStep } from 'uniswap/src/features/transactions/steps/permit2Signature'
import { createPermit2TransactionStep } from 'uniswap/src/features/transactions/steps/permit2Transaction'
import { createRevocationTransactionStep } from 'uniswap/src/features/transactions/steps/revoke'
import { TransactionStep } from 'uniswap/src/features/transactions/steps/types'
import { orderClassicSwapSteps } from 'uniswap/src/features/transactions/swap/steps/classicSteps'
import { createSignUniswapXOrderStep } from 'uniswap/src/features/transactions/swap/steps/signOrder'
import {
  createSwapTransactionAsyncStep,
  createSwapTransactionStep,
  createSwapTransactionStepBatched,
} from 'uniswap/src/features/transactions/swap/steps/swap'
import { orderUniswapXSteps } from 'uniswap/src/features/transactions/swap/steps/uniswapxSteps'
import { SwapTxAndGasInfo, isValidSwapTxContext } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { isAggregator, isBridge, isClassic, isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'

export function generateSwapTransactionSteps(txContext: SwapTxAndGasInfo): TransactionStep[] {
  if (!isValidSwapTxContext(txContext)) {
    return []
  }

  const { trade, approveTxRequest, revocationTxRequest } = txContext

  const revocation = createRevocationTransactionStep(revocationTxRequest, trade.inputAmount.currency.wrapped)
  const approval = createApprovalTransactionStep(approveTxRequest, trade.inputAmount)

  if (isClassic(txContext)) {
    const { swapRequestArgs } = txContext

    if (txContext.unsigned) {
      return orderClassicSwapSteps({
        revocation,
        approval,
        permit: createPermit2SignatureStep(txContext.permit.typedData, trade.inputAmount.currency),
        swap: createSwapTransactionAsyncStep(swapRequestArgs),
      })
    }

    const txRequests = txContext.txRequests
    if (txRequests.length > 1) {
      return orderClassicSwapSteps({
        permit: undefined,
        swap: createSwapTransactionStepBatched(txRequests),
      })
    }

    const permit = txContext.permit
      ? createPermit2TransactionStep(txContext.permit.txRequest, trade.inputAmount)
      : undefined

    return orderClassicSwapSteps({
      revocation,
      approval,
      permit,
      swap: createSwapTransactionStep(txRequests[0]),
    })
  }

  if (isUniswapX(txContext)) {
    return orderUniswapXSteps({
      revocation,
      approval,
      signOrder: createSignUniswapXOrderStep(txContext.permit.typedData, txContext.trade.quote.quote),
    })
  }

  if (isBridge(txContext)) {
    const txRequests = txContext.txRequests
    if (txRequests.length > 1) {
      return orderClassicSwapSteps({
        permit: undefined,
        swap: createSwapTransactionStepBatched(txRequests),
      })
    }
    return orderClassicSwapSteps({
      revocation,
      approval,
      permit: undefined,
      swap: createSwapTransactionStep(txRequests[0]),
    })
  }

  if (isAggregator(txContext)) {
    const { swapRequestArgs } = txContext

    if (txContext.unsigned) {
      return orderClassicSwapSteps({
        revocation,
        approval,
        permit: createPermit2SignatureStep(txContext.permit.typedData, trade.inputAmount.currency),
        swap: createSwapTransactionAsyncStep(swapRequestArgs),
      })
    }

    const txRequests = txContext.txRequests
    if (txRequests.length > 1) {
      return orderClassicSwapSteps({
        permit: undefined,
        swap: createSwapTransactionStepBatched(txRequests),
      })
    }

    const permit = txContext.permit
      ? createPermit2TransactionStep(txContext.permit.txRequest, trade.inputAmount)
      : undefined

    return orderClassicSwapSteps({
      revocation,
      approval,
      permit,
      swap: createSwapTransactionStep(txRequests[0]),
    })
  }

  return []
}
