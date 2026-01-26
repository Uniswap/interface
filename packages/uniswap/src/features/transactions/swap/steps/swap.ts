import { TradingApi } from '@universe/api'
import invariant from 'tiny-invariant'
import { UnexpectedTransactionStateError } from 'uniswap/src/features/transactions/errors'
import {
  OnChainTransactionFields,
  OnChainTransactionFieldsBatched,
  TransactionStepType,
} from 'uniswap/src/features/transactions/steps/types'
import { validateTransactionRequest } from 'uniswap/src/features/transactions/swap/utils/trade'
import { ValidatedTransactionRequest } from 'uniswap/src/features/transactions/types/transactionRequests'

export interface SwapTransactionStep extends OnChainTransactionFields {
  // Swaps that don't require permit
  type: TransactionStepType.SwapTransaction
}
export interface SwapTransactionStepAsync {
  // Swaps that require permit
  type: TransactionStepType.SwapTransactionAsync
  getTxRequest(signature: string): Promise<ValidatedTransactionRequest | undefined> // fetches tx request from trading api with signature
}

export interface SwapTransactionStepBatched extends OnChainTransactionFieldsBatched {
  type: TransactionStepType.SwapTransactionBatched
}

export function createSwapTransactionStep(txRequest: ValidatedTransactionRequest): SwapTransactionStep {
  return { type: TransactionStepType.SwapTransaction, txRequest }
}

/**
 * HashKey chains (133, 177) do not use swap API.
 * Transactions are built directly from quote methodParameters.
 * This function should never be called for HashKey chains.
 */
export function createSwapTransactionAsyncStep(
  swapRequestArgs: TradingApi.CreateSwapRequest | undefined,
): SwapTransactionStepAsync {
  return {
    type: TransactionStepType.SwapTransactionAsync,
    getTxRequest: async (): Promise<ValidatedTransactionRequest | undefined> => {
      throw new Error(
        'Swap API is not used for HashKey chains. Transactions should be built from quote methodParameters using buildTxRequestFromTrade.',
      )
    },
  }
}

export function createSwapTransactionStepBatched(
  txRequests: ValidatedTransactionRequest[],
): SwapTransactionStepBatched {
  return { type: TransactionStepType.SwapTransactionBatched, batchedTxRequests: txRequests }
}

export async function getSwapTxRequest(
  step: SwapTransactionStep | SwapTransactionStepAsync,
  signature: string | undefined,
): Promise<ValidatedTransactionRequest> {
  if (step.type === TransactionStepType.SwapTransaction) {
    return step.txRequest
  }
  if (!signature) {
    throw new UnexpectedTransactionStateError('Signature required for async swap transaction step')
  }

  const txRequest = await step.getTxRequest(signature)
  invariant(txRequest !== undefined)

  return txRequest
}
