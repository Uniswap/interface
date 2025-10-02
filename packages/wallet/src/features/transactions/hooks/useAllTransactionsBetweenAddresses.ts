import { useMemo } from 'react'
import { useSelectAddressTransactions } from 'uniswap/src/features/transactions/selectors'
import { TransactionDetails, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'

/**
 * Gets all transactions from a given sender and to a given recipient
 * @param sender Get all transactions sent by this sender
 * @param recipient Then filter so that we only keep txns to this recipient
 */
export function useAllTransactionsBetweenAddresses(
  sender: Address,
  recipient: Maybe<Address>,
): TransactionDetails[] | undefined {
  const txnsToSearch = useSelectAddressTransactions({ evmAddress: sender })
  return useMemo(() => {
    if (!sender || !recipient || !txnsToSearch) {
      return undefined
    }
    return txnsToSearch.filter(
      (tx: TransactionDetails) => tx.typeInfo.type === TransactionType.Send && tx.typeInfo.recipient === recipient,
    )
  }, [recipient, sender, txnsToSearch])
}
