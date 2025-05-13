import { useTranslation } from 'react-i18next'
import { AlertTriangleFilled } from 'ui/src/components/icons'
import { NotSupportedNetworkNotification as NotSupportedNetworkNotificationType } from 'uniswap/src/features/notifications/types'
import { NotificationToast } from 'wallet/src/features/notifications/components/NotificationToast'

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
      icon={<AlertTriangleFilled color="$neutral2" size="$icon.20" />}
      title={t('extension.network.notSupported')}
    />
  )
}
