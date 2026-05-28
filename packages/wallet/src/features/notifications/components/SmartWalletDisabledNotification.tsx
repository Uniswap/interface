import { CheckmarkCircle } from 'ui/src/components/icons'
import { NotificationToast } from 'uniswap/src/components/notifications/NotificationToast'
import { AppNotificationDefault } from 'uniswap/src/features/notifications/slice/types'

export function SmartWalletDisabledNotification({
  notification: { hideDelay = 2000, title },
}: {
  notification: Pick<AppNotificationDefault, 'title' | 'hideDelay'>
}): JSX.Element | null {
  return (
    <NotificationToast
      smallToast
      hideDelay={hideDelay}
      icon={<CheckmarkCircle size="$icon.16" color="$neutral2" />}
      title={title}
    />
  )
}
