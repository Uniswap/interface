import { TransactionDetails } from 'src/features/transactions/types'

export function getPendingTransactions(transactions: TransactionDetails[]) {
  return transactions.filter((transaction: TransactionDetails) => Boolean(!transaction.receipt))
}
