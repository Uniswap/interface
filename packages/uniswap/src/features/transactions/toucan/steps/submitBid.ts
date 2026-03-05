import { OnChainTransactionFields, TransactionStepType } from 'uniswap/src/features/transactions/steps/types'

export interface ToucanBidTransactionStep extends OnChainTransactionFields {
  type: TransactionStepType.ToucanBidTransactionStep
}
