import { useSporeColors } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { CheckmarkCircle } from 'wallet/src/components/icons/CheckmarkCircle'
import { NotificationToast } from 'wallet/src/features/notifications/components/NotificationToast'
import { AppNotificationDefault } from 'wallet/src/features/notifications/types'

export function SuccessNotification({
  notification: { hideDelay = 2000, title },
}: {
  notification: Pick<AppNotificationDefault, 'title' | 'hideDelay'>
}): JSX.Element | null {
  const colors = useSporeColors()

  return (
    <NotificationToast
      smallToast
      hideDelay={hideDelay}
      icon={
        <CheckmarkCircle
          backgroundColor={colors.statusSuccess.val}
          checkmarkStrokeWidth={2}
          color={colors.sporeWhite.val}
          size={iconSizes.icon16}
        />
      }
      title={title}
    />
  )
}
