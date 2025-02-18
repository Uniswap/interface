import { useTranslation } from 'react-i18next'
import { useSporeColors } from 'ui/src'
import { Eye } from 'ui/src/components/icons/Eye'
import { EyeOff } from 'ui/src/components/icons/EyeOff'
import { iconSizes } from 'ui/src/theme'
import { ChangeAssetVisibilityNotification as ChangeAssetVisibilityNotificationType } from 'uniswap/src/features/notifications/types'
import { NotificationToast } from 'wallet/src/features/notifications/components/NotificationToast'

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
          <EyeOff color={colors.neutral1.get()} size={iconSizes.icon24} />
        ) : (
          <Eye color={colors.neutral1.get()} size={iconSizes.icon24} />
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
