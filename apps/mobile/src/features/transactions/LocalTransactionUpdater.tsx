import { useAppSelector } from 'src/app/hooks'
import { selectActiveAccountNotifications } from 'src/features/notifications/selectors'
import { AppNotificationType } from 'src/features/notifications/types'
import { useRefetchQueries } from 'wallet/src/data/utils'
import { ONE_SECOND_MS } from 'wallet/src/utils/time'
import { useTimeout } from 'wallet/src/utils/timing'

/**
 * Refetch all queries if active account has a notification for an in-app transaction.
 *
 * This helps synchronize balance data when new txns are detected, especially because our
 * polling interval for portofolio balances is longer than block settlement times.
 *
 * Note: this is need along with AddressTransactionHistoryUpdater, as that only listens
 * for remote transactions which are less live than in-app notifications.
 */
export function LocalTransactionUpdater(): null {
  const notifications = useAppSelector(selectActiveAccountNotifications)
  const refetchQueries = useRefetchQueries()

  const shouldRefetch = Boolean(
    notifications[0] && notifications[0].type === AppNotificationType.Transaction
  )

  useTimeout(() => {
    if (shouldRefetch) {
      refetchQueries()
    }
    // Delay 1s to ensure NXYZ balances sync after we detect this new txn. (As balances pulled
    // from different data source)
  }, ONE_SECOND_MS)

  return null
}
