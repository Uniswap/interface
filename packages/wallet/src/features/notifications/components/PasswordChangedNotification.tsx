import { useTranslation } from 'react-i18next'
import { SuccessNotification } from 'wallet/src/features/notifications/components/SuccessNotification'
import { PasswordChangedNotification as PasswordChangedNotificationType } from 'wallet/src/features/notifications/types'

export function PasswordChangedNotification({
  notification: { hideDelay },
}: {
  notification: PasswordChangedNotificationType
}): JSX.Element {
  const { t } = useTranslation()
  return <SuccessNotification notification={{ title: t('notification.passwordChanged'), hideDelay }} />
}
