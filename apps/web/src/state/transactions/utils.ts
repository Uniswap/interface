import { ConfirmedTransactionDetails, PendingTransactionDetails, TransactionDetails } from 'state/transactions/types'
import { TransactionStatus } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

export function isPendingTx(tx: TransactionDetails): tx is PendingTransactionDetails {
  return tx.status === TransactionStatus.Pending && !tx.cancelled
}

export function isConfirmedTx(tx: TransactionDetails): tx is ConfirmedTransactionDetails {
  return tx.status === TransactionStatus.Confirmed || tx.status === TransactionStatus.Failed
}
