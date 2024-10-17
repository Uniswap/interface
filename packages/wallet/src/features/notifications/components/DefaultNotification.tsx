import { NotificationToast } from 'wallet/src/features/notifications/components/NotificationToast'
import { AppNotificationDefault } from 'wallet/src/features/notifications/types'

export function DefaultNotification({
  notification: { address, title, hideDelay },
}: {
  notification: AppNotificationDefault
}): JSX.Element {
  return <NotificationToast address={address} hideDelay={hideDelay} title={title} />
}
