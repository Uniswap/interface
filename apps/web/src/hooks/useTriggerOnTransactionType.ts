import { useEffect, useMemo } from 'react'
import { usePendingTransactions } from 'state/transactions/hooks'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { usePrevious } from 'utilities/src/react/hooks'

/**
 * Trigger a function when a transaction of a given type is confirmed
 * @param type - The type of transaction to trigger on
 * @param trigger - The function to trigger
 */
export function useTriggerOnTransactionType(type: TransactionType, trigger: () => void) {
  const pendingTransactions = usePendingTransactions()
  const numPendingTransactions = useMemo(
    () => pendingTransactions.filter((tx) => tx.typeInfo.type === type).length,
    [pendingTransactions, type],
  )
  const prevNumPendingTransactions = usePrevious(numPendingTransactions)

  useEffect(() => {
    if (prevNumPendingTransactions && numPendingTransactions < prevNumPendingTransactions) {
      trigger()
    }
  }, [numPendingTransactions, prevNumPendingTransactions, trigger])
}
