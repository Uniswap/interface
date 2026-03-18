import { BatchedTransaction } from 'wallet/src/features/batchedTransactions/slice'
import { WalletState } from 'wallet/src/state/walletReducer'

export const selectBatchedTransactionById = (state: WalletState, batchId: string): BatchedTransaction | undefined =>
  state.batchedTransactions[batchId]
