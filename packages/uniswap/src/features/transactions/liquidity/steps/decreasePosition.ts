import { OnChainTransactionFields, TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { ValidatedTransactionRequest } from 'uniswap/src/features/transactions/types/transactionRequests'

export interface DecreasePositionTransactionStep extends OnChainTransactionFields {
  // Doesn't require permit
  type: TransactionStepType.DecreasePositionTransaction
}

export function createDecreasePositionStep(txRequest: ValidatedTransactionRequest): DecreasePositionTransactionStep {
  return {
    type: TransactionStepType.DecreasePositionTransaction,
    txRequest,
  }
}
