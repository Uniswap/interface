import { useTranslation } from 'react-i18next'
import { UniversalImage } from 'ui/src'
import { borderRadii, iconSizes } from 'ui/src/theme'
import { NotificationToast } from 'uniswap/src/components/notifications/NotificationToast'
import { DappConnectedNotification as DappConnectedNotificationType } from 'uniswap/src/features/notifications/slice/types'

export function DappConnectedNotification({
  notification: { hideDelay = 2000, dappIconUrl },
}: {
  notification: DappConnectedNotificationType
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
      title={t('common.text.connected')}
    />
  )
}
