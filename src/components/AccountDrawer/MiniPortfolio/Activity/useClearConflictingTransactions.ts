import { TransactionListQuery } from 'graphql/data/__generated__/types-and-hooks'
import { useEffect } from 'react'
import { useTransactionRemover } from 'state/transactions/hooks'

import { ActivityMap } from './types'

// this hook removes local transactions that have nonces that are duplicates of remote transactions
export function useClearConflictingTransactions(data: TransactionListQuery | undefined, localMap: ActivityMap) {
  const removeLocalTransaction = useTransactionRemover()

  useEffect(() => {
    const remoteActivity = data?.portfolios?.[0]?.assetActivities
    if (!remoteActivity) return
    const duplicateNonceActions = []
    const localActivityList = Object.values(localMap)
    const remoteNonces = new Set(remoteActivity.map((remoteAction) => remoteAction.transaction.nonce))
    for (const localAction of localActivityList) {
      // nonce is ? guarded because users may have transactions in localstorage without the data
      if (localAction?.nonce && remoteNonces.has(localAction.nonce)) {
        duplicateNonceActions.push(localAction)
      }
    }
    duplicateNonceActions.forEach((duplicate) => removeLocalTransaction(duplicate.hash))
  }, [data?.portfolios, localMap, removeLocalTransaction])
}
