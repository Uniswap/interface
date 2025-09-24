import { useTranslation } from 'react-i18next'
import { SpinningLoader } from 'ui/src'
import { NotificationToast } from 'uniswap/src/components/notifications/NotificationToast'
import { TRANSACTION_PENDING_NOTIFICATION_DELAY } from 'wallet/src/features/notifications/components/SwapPendingNotification'

export function TransactionPendingNotification(): JSX.Element {
  const { t } = useTranslation()
  return (
    <NotificationToast
      smallToast
      hideDelay={TRANSACTION_PENDING_NOTIFICATION_DELAY}
      icon={<SpinningLoader color="$accent1" />}
      title={t('notification.transaction.pending')}
    />
  )
}
