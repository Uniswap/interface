import { useTranslation } from 'react-i18next'
import { AlertTriangleFilled } from 'ui/src/components/icons'
import { NotificationToast } from 'uniswap/src/components/notifications/NotificationToast'
import { NotSupportedNetworkNotification as NotSupportedNetworkNotificationType } from 'uniswap/src/features/notifications/slice/types'

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
