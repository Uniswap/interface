import { useWeb3React } from '@web3-react/core'
import { TransactionListQuery } from 'graphql/data/__generated__/types-and-hooks'
import { useEffect } from 'react'
import { useTransactionRemover } from 'state/transactions/hooks'

import { ActivityMap } from './types'

// this hook removes local transactions that have nonces that are duplicates of remote transactions
export function useClearConflictingTransactions(data: TransactionListQuery | undefined, localMap: ActivityMap) {
  const removeLocalTransaction = useTransactionRemover()
  const { account } = useWeb3React()
  useEffect(() => {
    const remoteActivity = data?.portfolios?.[0]?.assetActivities
    if (!remoteActivity || !account) return
    const duplicateNonceActions = []
    const localActivityList = Object.values(localMap)
    const ownedRemoteNoncesList = remoteActivity
      .filter((remoteActivity) => remoteActivity.transaction.from === account)
      .map((remoteActivity) => remoteActivity.transaction.nonce)
    const remoteNonces = new Set(ownedRemoteNoncesList)
    for (const localAction of localActivityList) {
      // nonce is ? guarded because users may have transactions in localstorage without the data
      if (localAction?.nonce && remoteNonces.has(localAction.nonce)) {
        duplicateNonceActions.push(localAction)
      }
    }

    duplicateNonceActions.forEach((duplicate) => removeLocalTransaction(duplicate.hash))
  }, [account, data?.portfolios, localMap, removeLocalTransaction])
}
