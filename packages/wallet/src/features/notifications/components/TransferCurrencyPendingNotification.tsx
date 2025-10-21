import { useTranslation } from 'react-i18next'
import { SpinningLoader } from 'ui/src'
import { NotificationToast } from 'wallet/src/features/notifications/components/NotificationToast'
import { TRANSACTION_PENDING_NOTIFICATION_DELAY } from 'wallet/src/features/notifications/components/SwapPendingNotification'

export function TransferCurrencyPendingNotification(): JSX.Element {
  const { t } = useTranslation()

  return (
    <NotificationToast
      smallToast
      hideDelay={TRANSACTION_PENDING_NOTIFICATION_DELAY}
      icon={<SpinningLoader color="$accent1" />}
      title={t('notification.transfer.pending')}
    />
  )
}
