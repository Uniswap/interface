import React, { PropsWithChildren } from 'react'
import { useAppSelector } from 'src/app/hooks'
import { AssetType } from 'src/entities/assets'
import {
  ApproveNotification,
  CopiedNotification,
  DefaultNotification,
  ErrorNotification,
  SwapNetworkNotification,
  SwapNotification,
  TransferCurrencyNotification,
  TransferNFTNotification,
  UnknownTxNotification,
  WCNotification,
} from 'src/features/notifications/Notifications'
import { selectActiveAccountNotifications } from 'src/features/notifications/selectors'
import { AppNotification, AppNotificationType } from 'src/features/notifications/types'
import { TransactionType } from 'src/features/transactions/types'

export function NotificationToastWrapper({ children }: PropsWithChildren<any>) {
  const notifications = useAppSelector(selectActiveAccountNotifications)
  const notification = notifications[0]
  return (
    <>
      {notification && <NotificationToastRouter notification={notification} />}
      {children}
    </>
  )
}

export function NotificationToastRouter({ notification }: { notification: AppNotification }) {
  switch (notification.type) {
    case AppNotificationType.WalletConnect:
      return <WCNotification notification={notification} />
    case AppNotificationType.Error:
      return <ErrorNotification notification={notification} />
    case AppNotificationType.Default:
      return <DefaultNotification notification={notification} />
    case AppNotificationType.Copied:
      return <CopiedNotification notification={notification} />
    case AppNotificationType.SwapNetwork:
      return <SwapNetworkNotification notification={notification} />
    case AppNotificationType.Transaction:
      switch (notification.txType) {
        case TransactionType.Approve:
          return <ApproveNotification notification={notification} />
        case TransactionType.Swap:
          return <SwapNotification notification={notification} />
        case TransactionType.Send:
        case TransactionType.Receive:
          const { assetType } = notification
          if (assetType === AssetType.Currency) {
            return <TransferCurrencyNotification notification={notification} />
          } else {
            return <TransferNFTNotification notification={notification} />
          }
        case TransactionType.Unknown:
          return <UnknownTxNotification notification={notification} />
      }
  }
}
