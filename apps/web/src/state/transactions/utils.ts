import { ConfirmedTransactionDetails, PendingTransactionDetails } from 'state/transactions/types'
import type { InterfaceTransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { TransactionStatus, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'

export function isPendingTx(
  tx: InterfaceTransactionDetails,
  skipDepositedBridgeTxs = false,
): tx is PendingTransactionDetails {
  const skipBridgeTx =
    skipDepositedBridgeTxs && tx.typeInfo.type === TransactionType.Bridge && tx.typeInfo.depositConfirmed
  return tx.status === TransactionStatus.Pending && !tx.cancelled && !skipBridgeTx
}

export function isConfirmedTx(tx: InterfaceTransactionDetails): tx is ConfirmedTransactionDetails {
  return tx.status === TransactionStatus.Success || tx.status === TransactionStatus.Failed
}
