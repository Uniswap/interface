import { useSelectAddressNotifications } from 'uniswap/src/features/notifications/slice/hooks'
import { AppNotification, AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { DappConnectedNotification } from 'wallet/src/features/notifications/components/DappConnectedNotification'
import { DappDisconnectedNotification } from 'wallet/src/features/notifications/components/DappDisconnectedNotification'
import { NotSupportedNetworkNotification } from 'wallet/src/features/notifications/components/NotSupportedNetworkNotification'
import { PasswordChangedNotification } from 'wallet/src/features/notifications/components/PasswordChangedNotification'
import { WalletNotificationToastRouter } from 'wallet/src/features/notifications/components/SharedNotificationToastRouter'
import { useActiveAccountAddress } from 'wallet/src/features/wallet/hooks'

export function NotificationToastWrapper(): JSX.Element | null {
  const activeAccountAddress = useActiveAccountAddress()
  const notifications = useSelectAddressNotifications(activeAccountAddress)
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

  return <WalletNotificationToastRouter notification={notification} />
}
