import { SwapNetworkNotification } from 'wallet/src/features/notifications/components/SwapNetworkNotification'
import { SwapPendingNotification } from 'wallet/src/features/notifications/components/SwapPendingNotification'
import { AppNotification, AppNotificationType } from 'wallet/src/features/notifications/types'

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
  }

  return null
}
