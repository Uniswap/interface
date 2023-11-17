import { TransactionStatus, useActivityQuery } from 'graphql/data/__generated__/types-and-hooks'
import { useEffect, useMemo } from 'react'
import { usePendingOrders } from 'state/signatures/hooks'
import { usePendingTransactions, useTransactionCanceller } from 'state/transactions/hooks'
import { useFormatter } from 'utils/formatNumbers'

import { useLocalActivities } from './parseLocal'
import { parseRemoteActivities } from './parseRemote'
import { Activity, ActivityMap } from './types'

/** Detects transactions from same account with the same nonce and different hash */
function findCancelTx(localActivity: Activity, remoteMap: ActivityMap, account: string): string | undefined {
  // handles locally cached tx's that were stored before we started tracking nonces
  if (!localActivity.nonce || localActivity.status !== TransactionStatus.Pending) return undefined

  for (const remoteTx of Object.values(remoteMap)) {
    if (!remoteTx) continue

    // A pending tx is 'cancelled' when another tx with the same account & nonce but different hash makes it on chain
    if (
      remoteTx.nonce === localActivity.nonce &&
      remoteTx.from.toLowerCase() === account.toLowerCase() &&
      remoteTx.hash.toLowerCase() !== localActivity.hash.toLowerCase() &&
      remoteTx.chainId === localActivity.chainId
    ) {
      return remoteTx.hash
    }
  }

  return undefined
}

/** Deduplicates local and remote activities */
function combineActivities(localMap: ActivityMap = {}, remoteMap: ActivityMap = {}): Array<Activity> {
  const txHashes = [...new Set([...Object.keys(localMap), ...Object.keys(remoteMap)])]

  return txHashes.reduce((acc: Array<Activity>, hash) => {
    const localActivity = (localMap?.[hash] ?? {}) as Activity
    const remoteActivity = (remoteMap?.[hash] ?? {}) as Activity

    if (localActivity.cancelled) {
      // Hides misleading activities caused by cross-chain nonce collisions previously being incorrectly labelled as cancelled txs in redux
      if (localActivity.chainId !== remoteActivity.chainId) {
        acc.push(remoteActivity)
        return acc
      }
      // Remote data only contains data of the cancel tx, rather than the original tx, so we prefer local data here
      acc.push(localActivity)
    } else {
      // Generally prefer remote values to local value because i.e. remote swap amounts are on-chain rather than client-estimated
      acc.push({ ...localActivity, ...remoteActivity } as Activity)
    }

    return acc
  }, [])
}

export function useAllActivities(account: string) {
  const { formatNumberOrString } = useFormatter()
  const { data, loading, refetch } = useActivityQuery({
    variables: { account },
    errorPolicy: 'all',
    fetchPolicy: 'cache-first',
  })

  const localMap = useLocalActivities(account)
  const remoteMap = useMemo(
    () => parseRemoteActivities(formatNumberOrString, data?.portfolios?.[0].assetActivities),
    [data?.portfolios, formatNumberOrString]
  )
  const updateCancelledTx = useTransactionCanceller()

  /* Updates locally stored pendings tx's when remote data contains a conflicting cancellation tx */
  useEffect(() => {
    if (!remoteMap) return

    Object.values(localMap).forEach((localActivity) => {
      if (!localActivity) return

      const cancelHash = findCancelTx(localActivity, remoteMap, account)

      if (cancelHash) updateCancelledTx(localActivity.hash, localActivity.chainId, cancelHash)
    })
  }, [account, localMap, remoteMap, updateCancelledTx])

  const combinedActivities = useMemo(
    () => (remoteMap ? combineActivities(localMap, remoteMap) : undefined),
    [localMap, remoteMap]
  )

  return { loading, activities: combinedActivities, refetch }
}

export function usePendingActivity() {
  const pendingTransactions = usePendingTransactions()
  const pendingOrders = usePendingOrders()

  const hasPendingActivity = pendingTransactions.length > 0 || pendingOrders.length > 0
  const pendingActivityCount = pendingTransactions.length + pendingOrders.length

  return { hasPendingActivity, pendingActivityCount }
}
