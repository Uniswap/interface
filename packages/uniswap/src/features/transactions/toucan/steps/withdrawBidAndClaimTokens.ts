import { OnChainTransactionFields, TransactionStepType } from 'uniswap/src/features/transactions/steps/types'

export interface ToucanWithdrawBidAndClaimTokensTransactionStep extends OnChainTransactionFields {
  type: TransactionStepType.ToucanWithdrawBidAndClaimTokensTransactionStep
}
