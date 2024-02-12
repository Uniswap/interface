import { NotificationToast } from 'wallet/src/features/notifications/components/NotificationToast'
import { AppErrorNotification } from 'wallet/src/features/notifications/types'

export function ErrorNotification({
  notification: { address, errorMessage, hideDelay },
}: {
  notification: AppErrorNotification
}): JSX.Element {
  return <NotificationToast address={address} hideDelay={hideDelay} title={errorMessage} />
}
