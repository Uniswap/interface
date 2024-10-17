import { CheckmarkCircle } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { NotificationToast } from 'wallet/src/features/notifications/components/NotificationToast'
import { AppNotificationDefault } from 'wallet/src/features/notifications/types'

export function SuccessNotification({
  notification: { hideDelay = 2000, title },
}: {
  notification: Pick<AppNotificationDefault, 'title' | 'hideDelay'>
}): JSX.Element | null {
  return (
    <NotificationToast
      smallToast
      hideDelay={hideDelay}
      icon={<CheckmarkCircle size={iconSizes.icon16} />}
      title={title}
    />
  )
}
