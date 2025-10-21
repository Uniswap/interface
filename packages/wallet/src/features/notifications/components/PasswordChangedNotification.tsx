import { useTranslation } from 'react-i18next'
import { PasswordChangedNotification as PasswordChangedNotificationType } from 'uniswap/src/features/notifications/types'
import { SuccessNotification } from 'wallet/src/features/notifications/components/SuccessNotification'

export function PasswordChangedNotification({
  notification: { hideDelay },
}: {
  notification: PasswordChangedNotificationType
}): JSX.Element {
  const { t } = useTranslation()
  return <SuccessNotification notification={{ title: t('notification.passwordChanged'), hideDelay }} />
}
