import { useMemo } from 'react'
import { useSelectAddressTransactions } from 'uniswap/src/features/transactions/selectors'
import {
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'

export function usePendingTransactions({
  evmAddress,
  svmAddress,
  ignoreTransactionTypes = [],
}: {
  evmAddress: Address | null
  svmAddress: Address | null
  ignoreTransactionTypes?: TransactionType[]
}): TransactionDetails[] | undefined {
  const transactions = useSelectAddressTransactions({ evmAddress, svmAddress })
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
export function useSortedPendingTransactions({
  evmAddress,
  svmAddress,
}: {
  evmAddress: Address | null
  svmAddress: Address | null
}): TransactionDetails[] | undefined {
  const transactions = usePendingTransactions({ evmAddress, svmAddress, ignoreTransactionTypes: [] })
  return useMemo(() => {
    if (!transactions) {
      return undefined
    }
    return transactions.sort((a: TransactionDetails, b: TransactionDetails) => a.addedTime - b.addedTime)
  }, [transactions])
}
