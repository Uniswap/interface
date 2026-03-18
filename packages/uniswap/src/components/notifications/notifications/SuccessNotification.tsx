import { CheckmarkCircle } from 'ui/src/components/icons/CheckmarkCircle'
import { NotificationToast } from 'uniswap/src/components/notifications/NotificationToast'
import { AppNotificationDefault } from 'uniswap/src/features/notifications/slice/types'

export function SuccessNotification({
  notification: { hideDelay = 2000, title },
}: {
  notification: Pick<AppNotificationDefault, 'title' | 'hideDelay'>
}): JSX.Element | null {
  return <NotificationToast smallToast hideDelay={hideDelay} icon={<CheckmarkCircle size="$icon.16" />} title={title} />
}
