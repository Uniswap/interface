import { useTranslation } from 'react-i18next'
import { Image } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { NotificationToast } from 'wallet/src/features/notifications/components/NotificationToast'
import { DappDisconnectedNotification } from 'wallet/src/features/notifications/types'

export function DappDisconnectedNotification({
  notification: { hideDelay = 2000, dappIconUrl },
}: {
  notification: DappDisconnectedNotification
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
      title={t('common.text.disconnected')}
    />
  )
}
