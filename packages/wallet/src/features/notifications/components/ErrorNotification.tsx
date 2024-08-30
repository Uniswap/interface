import { AlertCircleFilled } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { NotificationToast } from 'wallet/src/features/notifications/components/NotificationToast'
import { AppErrorNotification } from 'wallet/src/features/notifications/types'

export function ErrorNotification({
  notification: { address, errorMessage, hideDelay },
}: {
  notification: AppErrorNotification
}): JSX.Element {
  return (
    <NotificationToast
      smallToast
      address={address}
      hideDelay={hideDelay}
      icon={<AlertCircleFilled color="$neutral2" size={iconSizes.icon24} />}
      title={errorMessage}
    />
  )
}
