import { TransactionDetails, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'

const DUST_RECEIVE_USD_THRESHOLD = 0.005

export function isDustReceive(transaction: TransactionDetails): boolean {
  const { type, transactedUSDValue } = transaction.typeInfo
  if (type !== TransactionType.Receive) {
    return false
  }
  return transactedUSDValue !== undefined && transactedUSDValue < DUST_RECEIVE_USD_THRESHOLD
}
