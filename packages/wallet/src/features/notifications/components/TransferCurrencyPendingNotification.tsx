import { useTranslation } from 'react-i18next'
import { SpinningLoader } from 'wallet/src/components/loading/SpinningLoader'
import { NotificationToast } from 'wallet/src/features/notifications/components/NotificationToast'
import { TRANSACTION_PENDING_NOTIFICATION_DELAY } from 'wallet/src/features/notifications/components/SwapPendingNotification'
import { TransferCurrencyPendingNotification as TransferPendingNotificationType } from 'wallet/src/features/notifications/types'

export function TransferCurrencyPendingNotification({
  notification,
}: {
  notification: TransferPendingNotificationType
}): JSX.Element {
  const { t } = useTranslation()

  const { currencyInfo } = notification

  return (
    <NotificationToast
      smallToast
      hideDelay={TRANSACTION_PENDING_NOTIFICATION_DELAY}
      icon={<SpinningLoader color="$accent1" />}
      title={t('notification.transfer.pending', { currencySymbol: currencyInfo.currency.symbol })}
    />
  )
}
