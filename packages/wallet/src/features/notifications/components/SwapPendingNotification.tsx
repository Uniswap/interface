import { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { SpinningLoader } from 'ui/src'
import { NotificationToast } from 'uniswap/src/components/notifications/NotificationToast'
import { SwapPendingNotification as SwapPendingNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

// We roughly track the L1 block time, accuracy isnt crucial because we have other pending states,
// and when a txn confirms it ll replace this toast.
export const TRANSACTION_PENDING_NOTIFICATION_DELAY = 12 * ONE_SECOND_MS

export function SwapPendingNotification({ notification }: { notification: SwapPendingNotificationType }): JSX.Element {
  const { t } = useTranslation()

  const notificationText = getNotificationText(notification.wrapType, t)

  return (
    <NotificationToast
      smallToast
      hideDelay={TRANSACTION_PENDING_NOTIFICATION_DELAY}
      postCaptionElement={<SpinningLoader color="$accent1" />}
      title={notificationText}
    />
  )
}

// eslint-disable-next-line consistent-return
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
