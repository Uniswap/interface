import { useTranslation } from 'react-i18next'
import { UniversalImage } from 'ui/src'
import { borderRadii, iconSizes } from 'ui/src/theme'
import { NotificationToast } from 'wallet/src/features/notifications/components/NotificationToast'
import { DappDisconnectedNotification as DappDisconnectedNotificationType } from 'wallet/src/features/notifications/types'

export function DappDisconnectedNotification({
  notification: { hideDelay = 2000, dappIconUrl },
}: {
  notification: DappDisconnectedNotificationType
}): JSX.Element | null {
  const { t } = useTranslation()

  return (
    <NotificationToast
      smallToast
      hideDelay={hideDelay}
      icon={
        dappIconUrl ? (
          <UniversalImage
            uri={dappIconUrl}
            style={{ image: { borderRadius: borderRadii.rounded8 } }}
            size={{
              width: iconSizes.icon20,
              height: iconSizes.icon20,
            }}
          />
        ) : undefined
      }
      title={t('common.text.disconnected')}
    />
  )
}
