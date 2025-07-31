import { fetchSwap } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import type { CreateSwapRequest } from 'uniswap/src/data/tradingApi/__generated__'
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

export function createSwapTransactionAsyncStep(
  swapRequestArgs: CreateSwapRequest | undefined,
): SwapTransactionStepAsync {
  return {
    type: TransactionStepType.SwapTransactionAsync,
    getTxRequest: async (signature: string): Promise<ValidatedTransactionRequest | undefined> => {
      if (!swapRequestArgs) {
        return undefined
      }

      const { swap } = await fetchSwap({
        ...swapRequestArgs,
        signature,
        /* simulating transaction provides a more accurate gas limit, and the simulation will succeed because async swap step will only occur after approval has been confirmed. */
        simulateTransaction: true,
      })

      return validateTransactionRequest(swap)
    },
  }
}

export function createSwapTransactionStepBatched(
  txRequests: ValidatedTransactionRequest[],
): SwapTransactionStepBatched {
  return { type: TransactionStepType.SwapTransactionBatched, batchedTxRequests: txRequests }
}
