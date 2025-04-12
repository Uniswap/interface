import { AlertTriangleFilled } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { AppErrorNotification } from 'uniswap/src/features/notifications/types'
import { NotificationToast } from 'wallet/src/features/notifications/components/NotificationToast'

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
      icon={<AlertTriangleFilled color="$neutral2" size={iconSizes.icon24} />}
      title={errorMessage}
    />
  )
}
