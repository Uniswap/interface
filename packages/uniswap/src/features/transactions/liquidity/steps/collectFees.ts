import { OnChainTransactionFields, TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { ValidatedTransactionRequest } from 'uniswap/src/features/transactions/swap/utils/trade'

export interface CollectFeesTransactionStep extends OnChainTransactionFields {
  type: TransactionStepType.CollectFeesTransactionStep
}

export function createCollectFeesStep(txRequest: ValidatedTransactionRequest): CollectFeesTransactionStep {
  return {
    type: TransactionStepType.CollectFeesTransactionStep,
    txRequest,
  }
}
