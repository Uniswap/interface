import React from 'react'
import { useAppSelector } from 'src/app/hooks'
import {
  ApproveNotification,
  ChangeAssetVisibilityNotification,
  ChooseCountryNotification,
  CopiedNotification,
  DefaultNotification,
  ErrorNotification,
  ScantasticCompleteNotification,
  SuccessNotification,
  TransferCurrencyNotification,
  TransferNFTNotification,
  UnknownTxNotification,
  WCNotification,
  WrapNotification,
} from 'src/features/notifications/Notifications'
import { AssetType } from 'wallet/src/entities/assets'
import { SharedNotificationToastRouter } from 'wallet/src/features/notifications/components/SharedNotificationToastRouter'
import { selectActiveAccountNotifications } from 'wallet/src/features/notifications/selectors'
import { AppNotification, AppNotificationType } from 'wallet/src/features/notifications/types'
import { TransactionType } from 'wallet/src/features/transactions/types'

export function NotificationToastWrapper(): JSX.Element | null {
  const notifications = useAppSelector(selectActiveAccountNotifications)
  const notification = notifications?.[0]

  if (!notification) {
    return null
  }

  return <NotificationToastRouter notification={notification} />
}

function NotificationToastRouter({
  notification,
}: {
  notification: AppNotification
}): JSX.Element | null {
  switch (notification.type) {
    case AppNotificationType.WalletConnect:
      return <WCNotification notification={notification} />
    case AppNotificationType.Error:
      return <ErrorNotification notification={notification} />
    case AppNotificationType.Default:
      return <DefaultNotification notification={notification} />
    case AppNotificationType.Success:
      return <SuccessNotification notification={notification} />
    case AppNotificationType.Copied:
      return <CopiedNotification notification={notification} />
    case AppNotificationType.ChooseCountry:
      return <ChooseCountryNotification notification={notification} />
    case AppNotificationType.AssetVisibility:
      return <ChangeAssetVisibilityNotification notification={notification} />
    case AppNotificationType.ScantasticComplete:
      return <ScantasticCompleteNotification notification={notification} />
    case AppNotificationType.Transaction:
      switch (notification.txType) {
        case TransactionType.Approve:
          return <ApproveNotification notification={notification} />
        case TransactionType.Wrap:
          return <WrapNotification notification={notification} />
        case TransactionType.Send:
        case TransactionType.Receive:
          if (notification.assetType === AssetType.Currency) {
            return <TransferCurrencyNotification notification={notification} />
          } else {
            return <TransferNFTNotification notification={notification} />
          }
        case TransactionType.Unknown:
          return <UnknownTxNotification notification={notification} />
      }
  }

  return <SharedNotificationToastRouter notification={notification} />
}
