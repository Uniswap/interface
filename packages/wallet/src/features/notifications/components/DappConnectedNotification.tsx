import { useTranslation } from 'react-i18next'
import { Image } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { NotificationToast } from 'wallet/src/features/notifications/components/NotificationToast'
import { DappConnectedNotification } from 'wallet/src/features/notifications/types'

export function DappConnectedNotification({
  notification: { hideDelay = 2000, dappIconUrl },
}: {
  notification: DappConnectedNotification
}): JSX.Element | null {
  const { t } = useTranslation()

  return (
    <NotificationToast
      smallToast
      hideDelay={hideDelay}
      icon={
        dappIconUrl ? (
          <Image height={iconSizes.icon20} source={{ uri: dappIconUrl }} width={iconSizes.icon20} />
        ) : undefined
      }
      title={t('common.text.connected')}
    />
  )
}
