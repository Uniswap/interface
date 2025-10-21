import { useMemo } from 'react'
import { useSelectAddressTransactions } from 'uniswap/src/features/transactions/selectors'
import {
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'

export function usePendingTransactions(
  address: Address | null,
  ignoreTransactionTypes: TransactionType[] = [],
): TransactionDetails[] | undefined {
  const transactions = useSelectAddressTransactions(address)
  return useMemo(() => {
    if (!transactions) {
      return undefined
    }
    return transactions.filter(
      (tx: { status: TransactionStatus; typeInfo: { type: TransactionType } }) =>
        tx.status === TransactionStatus.Pending && !ignoreTransactionTypes.includes(tx.typeInfo.type),
    )
  }, [ignoreTransactionTypes, transactions])
}

// sorted oldest to newest
export function useSortedPendingTransactions(address: Address | null): TransactionDetails[] | undefined {
  const transactions = usePendingTransactions(address)
  return useMemo(() => {
    if (!transactions) {
      return undefined
    }
    return transactions.sort((a: TransactionDetails, b: TransactionDetails) => a.addedTime - b.addedTime)
  }, [transactions])
}
