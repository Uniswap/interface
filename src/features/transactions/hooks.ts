import { useMemo } from 'react'
import { useAppSelector } from 'src/app/hooks'
import { TransactionDetails, TransactionStatus } from 'src/features/transactions/types'
import { flattenObjectOfObjects } from 'src/utils/objects'

const SHOW_CONFIRMED_TRANSACTION_FOR_MS = 10_000

export function usePendingTransactions() {
  const allTransactions = useSortedTransactions()
  const now = Date.now()

  const pendingTransactions = allTransactions.filter((transaction: TransactionDetails) =>
    Boolean(!transaction.receipt)
  )
  const statusToTxs = allTransactions.reduce<
    Partial<Record<TransactionStatus, TransactionDetails[]>>
  >((acc, tx) => {
    const status = tx.status

    // ignore unfinished / unconfirmed txs
    if (!status || !tx.receipt?.confirmedTime) return acc

    // ignore older confirmed txs
    if (now - tx.receipt.confirmedTime > SHOW_CONFIRMED_TRANSACTION_FOR_MS) return acc

    acc[status] ??= []
    acc[status]!.push(tx)

    return acc
  }, {})

  const recentlyFailedTransactions = statusToTxs[TransactionStatus.Failed] ?? []
  const recentlySuccessfulTransactions = statusToTxs[TransactionStatus.Success] ?? []

  return {
    pendingTransactions,
    recentlyFailedTransactions,
    recentlySuccessfulTransactions,
  }
}

export function useSortedTransactions() {
  const txsByChainId = useAppSelector((state) => state.transactions.byChainId)
  return useMemo(() => {
    const txDetails = flattenObjectOfObjects(txsByChainId)
    return txDetails.sort((a, b) => a.addedTime - b.addedTime)
  }, [txsByChainId])
}
