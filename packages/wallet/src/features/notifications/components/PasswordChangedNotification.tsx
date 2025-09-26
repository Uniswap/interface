import { useTranslation } from 'react-i18next'
import { SuccessNotification } from 'uniswap/src/components/notifications/notifications/SuccessNotification'
import { PasswordChangedNotification as PasswordChangedNotificationType } from 'uniswap/src/features/notifications/slice/types'

export function PasswordChangedNotification({
  notification: { hideDelay },
}: {
  notification: PasswordChangedNotificationType
}): JSX.Element {
  const { t } = useTranslation()
  return <SuccessNotification notification={{ title: t('notification.passwordChanged'), hideDelay }} />
}
