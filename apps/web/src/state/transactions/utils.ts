import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { selectTransaction } from 'uniswap/src/features/transactions/selectors'
import type { InterfaceTransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { TransactionStatus, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import store from '~/state'
import { ConfirmedTransactionDetails, PendingTransactionDetails } from '~/state/transactions/types'

export function isPendingTx(
  tx: InterfaceTransactionDetails,
  skipDepositedBridgeTxs = false,
): tx is PendingTransactionDetails {
  const skipBridgeTx =
    skipDepositedBridgeTxs && tx.typeInfo.type === TransactionType.Bridge && tx.typeInfo.depositConfirmed
  return tx.status === TransactionStatus.Pending && !skipBridgeTx
}

export function isConfirmedTx(tx: InterfaceTransactionDetails): tx is ConfirmedTransactionDetails {
  return (
    (tx.status === TransactionStatus.Success || tx.status === TransactionStatus.Failed) && !!tx.receipt?.confirmedTime
  )
}

/**
 * Utility function to check if a transaction exists in the Redux store.
 * This is meant to be used outside of React components where hooks are not available.
 *
 * @param params - Object containing from address, chainId, and transaction id
 * @returns true if the transaction exists, false otherwise
 */
export function isExistingTransaction(params: { from: string; chainId: UniverseChainId; id: string }): boolean {
  const state = store.getState()
  return Boolean(selectTransaction(state, { address: params.from, chainId: params.chainId, txId: params.id }))
}
