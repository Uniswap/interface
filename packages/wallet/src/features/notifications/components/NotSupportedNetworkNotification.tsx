import { useTranslation } from 'react-i18next'
import { AlertTriangle } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { NotificationToast } from 'wallet/src/features/notifications/components/NotificationToast'
import { NotSupportedNetworkNotification as NotSupportedNetworkNotificationType } from 'wallet/src/features/notifications/types'

export function NotSupportedNetworkNotification({
  notification: { hideDelay = 2000 },
}: {
  notification: NotSupportedNetworkNotificationType
}): JSX.Element | null {
  const { t } = useTranslation()

  return (
    <NotificationToast
      smallToast
      hideDelay={hideDelay}
      icon={<AlertTriangle color="$neutral2" size={iconSizes.icon20} />}
      title={t('extension.network.notSupported')}
    />
  )
}
