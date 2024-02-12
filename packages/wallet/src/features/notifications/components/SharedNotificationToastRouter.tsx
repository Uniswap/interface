import { SwapNetworkNotification } from 'wallet/src/features/notifications/components/SwapNetworkNotification'
import { SwapNotification } from 'wallet/src/features/notifications/components/SwapNotification'
import { SwapPendingNotification } from 'wallet/src/features/notifications/components/SwapPendingNotification'
import { AppNotification, AppNotificationType } from 'wallet/src/features/notifications/types'
import { TransactionType } from 'wallet/src/features/transactions/types'

export function SharedNotificationToastRouter({
  notification,
}: {
  notification: AppNotification
}): JSX.Element | null {
  switch (notification.type) {
    case AppNotificationType.SwapNetwork:
      return <SwapNetworkNotification notification={notification} />
    case AppNotificationType.SwapPending:
      return <SwapPendingNotification notification={notification} />
    case AppNotificationType.Transaction:
      switch (notification.txType) {
        case TransactionType.Swap:
          return <SwapNotification notification={notification} />
      }
  }

  return null
}
