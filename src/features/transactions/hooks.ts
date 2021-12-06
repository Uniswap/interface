import { useAppSelector } from 'src/app/hooks'
import { RootState } from 'src/app/rootReducer'
import { ChainId } from 'src/constants/chains'
import { TransactionDetails } from 'src/features/transactions/types'
import { getKeys } from 'src/utils/objects'

const SHOW_CONFIRMED_TRANSACTION_FOR_MS = 10_000

const selectTransactions = (state: RootState) => state.transactions

// TODO: should actually be.. select top tx...
// 1. either still pending
// 2. just became successful/error
// memoized selector
export function usePendingTransactions() {
  const transactions = useAppSelector(selectTransactions)

  const allTransactions = getKeys(transactions)
    .map((chainId: ChainId) =>
      Object.keys(transactions[chainId]!).map((hash: string) => transactions[chainId]![hash]!)
    )
    .flat()
    .sort((a, b) => a.addedTime - b.addedTime)

  const now = Date.now()

  const pendingTransactions = allTransactions.filter((transaction: TransactionDetails) =>
    Boolean(transaction.receipt)
  )
  const [recentlyFailedTransactions, recentlySuccessfulTransactions] = allTransactions.reduce<
    [TransactionDetails[], TransactionDetails[]]
  >(
    (acc: [TransactionDetails[], TransactionDetails[]], transaction: TransactionDetails) => {
      if (transaction.receipt?.status === undefined || !transaction.confirmedTime) return acc

      // ignore older confirmed txs
      if (now - transaction.confirmedTime > SHOW_CONFIRMED_TRANSACTION_FOR_MS) return acc

      // receipt.status is 0 when failed, 1 when success
      acc[transaction.receipt.status!].push(transaction)

      return acc
    },
    [[], []]
  )

  return {
    pendingTransactions,
    recentlyFailedTransactions,
    recentlySuccessfulTransactions,
  }
}
