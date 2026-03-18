import { OnChainTransactionFields, TransactionStepType } from 'uniswap/src/features/transactions/steps/types'

export interface CollectLpIncentiveRewardsTransactionStep extends OnChainTransactionFields {
  type: TransactionStepType.CollectLpIncentiveRewardsTransactionStep
}
