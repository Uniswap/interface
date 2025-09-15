import { useAssetActivity } from 'appGraphql/data/apollo/AssetActivityProvider'
import { useLocalActivities } from 'components/AccountDrawer/MiniPortfolio/Activity/parseLocal'
import { parseRemoteActivities } from 'components/AccountDrawer/MiniPortfolio/Activity/parseRemote'
import { Activity, ActivityMap } from 'components/AccountDrawer/MiniPortfolio/Activity/types'
import { getActivityNonce, hasEncodedOrder, haveSameNonce } from 'components/AccountDrawer/MiniPortfolio/Activity/utils'
import { useCreateCancelTransactionRequest } from 'components/AccountDrawer/MiniPortfolio/Activity/utils/cancel'
import { GasFeeResult, GasSpeed, useTransactionGasFee } from 'hooks/useTransactionGasFee'
import { useEffect, useMemo } from 'react'
import { usePendingTransactions, usePendingUniswapXOrders, useTransactionCanceller } from 'state/transactions/hooks'
import { Routing } from 'uniswap/src/data/tradingApi/__generated__/index'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { TransactionStatus, UniswapXOrderDetails } from 'uniswap/src/features/transactions/types/transactionDetails'

/** Detects transactions from same account with the same nonce and different hash */
function findCancelTx({
  localActivity,
  remoteMap,
  account,
}: {
  localActivity: Activity
  remoteMap: ActivityMap
  account: string
}): string | undefined {
  // Skip activities without nonce or non-pending status
  if (!getActivityNonce(localActivity) || localActivity.status !== TransactionStatus.Pending) {
    return undefined
  }

  for (const remoteTx of Object.values(remoteMap)) {
    if (!remoteTx) {
      continue
    }

    // A pending tx is 'cancelled' when another tx with the same account & nonce but different hash makes it on chain
    if (
      haveSameNonce(localActivity, remoteTx) &&
      remoteTx.from.toLowerCase() === account.toLowerCase() &&
      remoteTx.hash &&
      localActivity.hash &&
      remoteTx.hash.toLowerCase() !== localActivity.hash.toLowerCase() &&
      remoteTx.chainId === localActivity.chainId
    ) {
      return remoteTx.hash
    }
  }

  return undefined
}

/** Deduplicates local and remote activities */
export function combineActivities(localMap: ActivityMap = {}, remoteMap: ActivityMap = {}): Array<Activity> {
  const activityIds = [...new Set([...Object.keys(localMap), ...Object.keys(remoteMap)])]

  return activityIds.reduce((acc: Array<Activity>, id) => {
    const localActivity = localMap[id]
    const remoteActivity = remoteMap[id]

    // Skip if both activities are undefined
    if (!localActivity && !remoteActivity) {
      return acc
    }

    // If only one exists, use that one
    if (!localActivity) {
      acc.push(remoteActivity as Activity)
      return acc
    }
    if (!remoteActivity) {
      acc.push(localActivity)
      return acc
    }

    // Both exist - apply merging logic
    if (localActivity.status === TransactionStatus.Canceled) {
      // Hides misleading activities caused by cross-chain nonce collisions previously being incorrectly labelled as cancelled txs in redux
      // If there is no remote activity fallback to local activity
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
  const { formatNumberOrString } = useLocalizationContext()
  const { activities, loading } = useAssetActivity()

  const localMap = useLocalActivities(account)
  const remoteMap = useMemo(() => {
    return parseRemoteActivities(activities, account, formatNumberOrString)
  }, [account, activities, formatNumberOrString])
  const updateCancelledTx = useTransactionCanceller()

  /* Updates locally stored pendings tx's when remote data contains a conflicting cancellation tx */
  useEffect(() => {
    if (!remoteMap) {
      return
    }

    Object.values(localMap).forEach((localActivity) => {
      if (!localActivity) {
        return
      }

      const cancelHash = findCancelTx({ localActivity, remoteMap, account })

      if (cancelHash) {
        updateCancelledTx({ id: localActivity.id, chainId: localActivity.chainId, cancelHash })
      }
    })
  }, [account, localMap, remoteMap, updateCancelledTx])

  const combinedActivities = useMemo(() => combineActivities(localMap, remoteMap ?? {}), [localMap, remoteMap])

  return { loading, activities: combinedActivities }
}

export function useOpenLimitOrders(account: string) {
  const { activities, loading } = useAllActivities(account)
  const openLimitOrders = activities.filter(
    (activity) =>
      activity.offchainOrderDetails?.routing === Routing.DUTCH_LIMIT && activity.status === TransactionStatus.Pending,
  )

  return {
    openLimitOrders,
    loading,
  }
}

export function usePendingActivity() {
  const allPendingTransactions = usePendingTransactions()
  const pendingOrders = usePendingUniswapXOrders()

  // Filter out UniswapX orders from pendingTransactions to avoid double-counting
  // UniswapX orders are handled separately via pendingOrders
  const pendingTransactions = allPendingTransactions.filter((tx) => !isUniswapX(tx))
  // Pending limit orders shown in the limit sidebar
  const pendingOrdersWithoutLimits = pendingOrders.filter((order) => order.routing !== Routing.DUTCH_LIMIT)

  const hasPendingActivity = pendingTransactions.length > 0 || pendingOrdersWithoutLimits.length > 0
  const pendingActivityCount = pendingTransactions.length + pendingOrdersWithoutLimits.length
  const isOnlyUnichainPendingActivity =
    hasPendingActivity &&
    [...pendingTransactions, ...pendingOrdersWithoutLimits].every((tx) =>
      [UniverseChainId.Unichain, UniverseChainId.UnichainSepolia].includes(tx.chainId),
    )

  return { hasPendingActivity, pendingActivityCount, isOnlyUnichainPendingActivity }
}

export function useCancelOrdersGasEstimate(orders?: UniswapXOrderDetails[]): GasFeeResult {
  // Single order cancellation uses the same gas estimation as multi-order
  // The multi-order path handles both cases appropriately
  const cancelTransactionParams = useMemo(
    () =>
      orders && orders.length >= 1
        ? {
            orders: orders.filter(hasEncodedOrder).map((order) => ({
              encodedOrder: order.encodedOrder,
              routing: order.routing,
            })),
            chainId: orders[0].chainId,
          }
        : undefined,
    [orders],
  )

  const cancelTransaction = useCreateCancelTransactionRequest(cancelTransactionParams) ?? undefined
  return useTransactionGasFee(cancelTransaction, GasSpeed.Fast)
}
