import { useTranslation } from 'react-i18next'
import { NotificationToast } from 'wallet/src/features/notifications/components/NotificationToast'
import { CopyFailedNotification as CopyFailedNotificationType } from 'wallet/src/features/notifications/types'

export function CopyFailedNotification({
  notification: { hideDelay = 2000 },
}: {
  notification: CopyFailedNotificationType
}): JSX.Element | null {
  const { t } = useTranslation()
  const title = t('Failed to copy to clipboard')

  return <NotificationToast hideDelay={hideDelay} title={title} />
}
