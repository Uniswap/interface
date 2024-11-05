import {
  ConfirmedTransactionDetails,
  PendingTransactionDetails,
  TransactionDetails,
  TransactionType,
} from 'state/transactions/types'
import { TransactionStatus } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

export function isPendingTx(tx: TransactionDetails, skipDepositedBridgeTxs = false): tx is PendingTransactionDetails {
  const skipBridgeTx = skipDepositedBridgeTxs && tx.info.type === TransactionType.BRIDGE && tx.info.depositConfirmed
  return tx.status === TransactionStatus.Pending && !tx.cancelled && !skipBridgeTx
}

export function isConfirmedTx(tx: TransactionDetails): tx is ConfirmedTransactionDetails {
  return tx.status === TransactionStatus.Confirmed || tx.status === TransactionStatus.Failed
}
