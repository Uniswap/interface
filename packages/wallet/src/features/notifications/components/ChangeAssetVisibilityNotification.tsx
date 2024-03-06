import { useTranslation } from 'react-i18next'
import { useSporeColors } from 'ui/src'
import EyeOffIcon from 'ui/src/assets/icons/eye-off.svg'
import EyeIcon from 'ui/src/assets/icons/eye.svg'
import { iconSizes } from 'ui/src/theme'
import { NotificationToast } from 'wallet/src/features/notifications/components/NotificationToast'
import { ChangeAssetVisibilityNotification as ChangeAssetVisibilityNotificationType } from 'wallet/src/features/notifications/types'

export function ChangeAssetVisibilityNotification({
  notification: { visible, hideDelay, assetName },
}: {
  notification: ChangeAssetVisibilityNotificationType
}): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()

  return (
    <NotificationToast
      smallToast
      hideDelay={hideDelay}
      icon={
        visible ? (
          <EyeOffIcon
            color={colors.neutral1.get()}
            height={iconSizes.icon24}
            width={iconSizes.icon24}
          />
        ) : (
          <EyeIcon
            color={colors.neutral1.get()}
            height={iconSizes.icon24}
            width={iconSizes.icon24}
          />
        )
      }
      title={
        visible
          ? t('notification.assetVisibility.hidden', { assetName })
          : t('notification.assetVisibility.unhidden', { assetName })
      }
    />
  )
}
