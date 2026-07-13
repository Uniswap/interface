import { useMemo } from 'react'
import { useSelectAddressTransactions } from 'uniswap/src/features/transactions/selectors'
import {
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { isLimitOrder } from 'uniswap/src/features/transactions/utils/uniswapX.utils'

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
    // Limit orders surface in their own view, not the generic pending list
    return transactions.filter(
      (tx) =>
        tx.status === TransactionStatus.Pending &&
        !ignoreTransactionTypes.includes(tx.typeInfo.type) &&
        !isLimitOrder(tx),
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
