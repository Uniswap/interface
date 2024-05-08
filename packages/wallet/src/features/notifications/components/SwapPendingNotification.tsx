import { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { SpinningLoader } from 'wallet/src/components/loading/SpinningLoader'
import { NotificationToast } from 'wallet/src/features/notifications/components/NotificationToast'
import { SwapPendingNotification as SwapPendingNotificationType } from 'wallet/src/features/notifications/types'
import { WrapType } from 'wallet/src/features/transactions/types'

// We roughly track the L1 block time, accuracy isnt crucial because we have other pending states,
// and when a txn confirms it ll replace this toast.
export const TRANSACTION_PENDING_NOTIFICATION_DELAY = 12 * ONE_SECOND_MS

export function SwapPendingNotification({
  notification,
}: {
  notification: SwapPendingNotificationType
}): JSX.Element {
  const { t } = useTranslation()

  const notificationText = getNotificationText(notification.wrapType, t)

  return (
    <NotificationToast
      smallToast
      hideDelay={TRANSACTION_PENDING_NOTIFICATION_DELAY}
      icon={<SpinningLoader color="$accent1" />}
      title={notificationText}
    />
  )
}

function getNotificationText(wrapType: WrapType, t: TFunction): string {
  switch (wrapType) {
    case WrapType.NotApplicable:
      return t('notification.swap.pending.swap')
    case WrapType.Unwrap:
      return t('notification.swap.pending.unwrap')
    case WrapType.Wrap:
      return t('notification.swap.pending.wrap')
  }
}
