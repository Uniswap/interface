import { useEffect, useState } from 'react'
import { usePendingTransactions } from 'state/transactions/hooks'
import { TransactionType } from 'state/transactions/types'

export function useLpIncentivesTransactionState() {
  const [isPendingTransaction, setIsPendingTransaction] = useState(false)
  const pendingTransactions = usePendingTransactions()

  useEffect(() => {
    const hasPendingClaim = pendingTransactions.some(
      (tx) => tx.info.type === TransactionType.LP_INCENTIVES_CLAIM_REWARDS,
    )

    setIsPendingTransaction(hasPendingClaim)
  }, [pendingTransactions])

  return isPendingTransaction
}
