import { CheckmarkCircle } from 'ui/src/components/icons'
import { AppNotificationDefault } from 'uniswap/src/features/notifications/types'
import { NotificationToast } from 'wallet/src/features/notifications/components/NotificationToast'

export function SuccessNotification({
  notification: { hideDelay = 2000, title },
}: {
  notification: Pick<AppNotificationDefault, 'title' | 'hideDelay'>
}): JSX.Element | null {
  return <NotificationToast smallToast hideDelay={hideDelay} icon={<CheckmarkCircle size="$icon.16" />} title={title} />
}
