import { OnChainTransactionFields, TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { ValidatedTransactionRequest } from 'uniswap/src/features/transactions/types/transactionRequests'

export interface DecreasePositionTransactionStep extends OnChainTransactionFields {
  // Doesn't require permit
  type: TransactionStepType.DecreasePositionTransaction
  sqrtRatioX96?: string
}

export function createDecreasePositionStep(
  txRequest: ValidatedTransactionRequest,
  sqrtRatioX96?: string,
): DecreasePositionTransactionStep {
  return {
    type: TransactionStepType.DecreasePositionTransaction,
    txRequest,
    sqrtRatioX96,
  }
}
