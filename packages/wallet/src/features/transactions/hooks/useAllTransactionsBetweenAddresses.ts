import { useMemo } from 'react'
import { useSelectAddressTransactions } from 'wallet/src/features/transactions/selectors'
import { TransactionDetails, TransactionType } from 'wallet/src/features/transactions/types'

/**
 * Gets all transactions from a given sender and to a given recipient
 * @param sender Get all transactions sent by this sender
 * @param recipient Then filter so that we only keep txns to this recipient
 */
export function useAllTransactionsBetweenAddresses(
  sender: Address,
  recipient: Maybe<Address>
): TransactionDetails[] | undefined {
  const txnsToSearch = useSelectAddressTransactions(sender)
  return useMemo(() => {
    if (!sender || !recipient || !txnsToSearch) {
      return
    }
    return txnsToSearch.filter(
      (tx: TransactionDetails) =>
        tx.typeInfo.type === TransactionType.Send && tx.typeInfo.recipient === recipient
    )
  }, [recipient, sender, txnsToSearch])
}
