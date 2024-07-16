import { DappConnectedNotification } from 'wallet/src/features/notifications/components/DappConnectedNotification'
import { DappDisconnectedNotification } from 'wallet/src/features/notifications/components/DappDisconnectedNotification'
import { NotSupportedNetworkNotification } from 'wallet/src/features/notifications/components/NotSupportedNetworkNotification'
import { PasswordChangedNotification } from 'wallet/src/features/notifications/components/PasswordChangedNotification'
import { SharedNotificationToastRouter } from 'wallet/src/features/notifications/components/SharedNotificationToastRouter'
import { selectActiveAccountNotifications } from 'wallet/src/features/notifications/selectors'
import { AppNotification, AppNotificationType } from 'wallet/src/features/notifications/types'
import { useAppSelector } from 'wallet/src/state'

export function NotificationToastWrapper(): JSX.Element | null {
  const notifications = useAppSelector(selectActiveAccountNotifications)
  const notification = notifications?.[0]

  if (!notification) {
    return null
  }

  return <NotificationToastRouter notification={notification} />
}

function NotificationToastRouter({ notification }: { notification: AppNotification }): JSX.Element | null {
  // Insert Extension-only notifications here.
  // Shared wallet notifications should go in SharedNotificationToastRouter.
  switch (notification.type) {
    case AppNotificationType.DappConnected:
      return <DappConnectedNotification notification={notification} />
    case AppNotificationType.NotSupportedNetwork:
      return <NotSupportedNetworkNotification notification={notification} />
    case AppNotificationType.DappDisconnected:
      return <DappDisconnectedNotification notification={notification} />
    case AppNotificationType.PasswordChanged:
      return <PasswordChangedNotification notification={notification} />
  }

  return <SharedNotificationToastRouter notification={notification} />
}
