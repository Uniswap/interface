import { ChangeAssetVisibilityNotification } from 'uniswap/src/components/notifications/notifications/ChangeAssetVisibilityNotification'
import { CopiedNotification } from 'uniswap/src/components/notifications/notifications/CopiedNotification'
import { SuccessNotification } from 'uniswap/src/components/notifications/notifications/SuccessNotification'
import { useSelectAddressNotifications } from 'uniswap/src/features/notifications/slice/hooks'
import { AppNotification, AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'

export function WebNotificationToastWrapper(): JSX.Element | null {
  const { evmAccount } = useWallet()
  const notifications = useSelectAddressNotifications(evmAccount?.address ?? null)
  const notification = notifications?.[0]

  if (!notification) {
    return null
  }

  return <NotificationToastRouter notification={notification} />
}

function NotificationToastRouter({ notification }: { notification: AppNotification }): JSX.Element | null {
  switch (notification.type) {
    case AppNotificationType.Copied:
      return <CopiedNotification notification={notification} />
    case AppNotificationType.AssetVisibility:
      return <ChangeAssetVisibilityNotification notification={notification} />
    case AppNotificationType.Success:
      return <SuccessNotification notification={notification} />
    default:
      return null
  }
}
