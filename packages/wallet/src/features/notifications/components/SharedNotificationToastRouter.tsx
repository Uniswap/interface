import { AssetType } from 'wallet/src/entities/assets'
import { ApproveNotification } from 'wallet/src/features/notifications/components/ApproveNotification'
import { ChangeAssetVisibilityNotification } from 'wallet/src/features/notifications/components/ChangeAssetVisibilityNotification'
import { ChooseCountryNotification } from 'wallet/src/features/notifications/components/ChooseCountryNotification'
import { CopiedNotification } from 'wallet/src/features/notifications/components/CopiedNotification'
import { CopyFailedNotification } from 'wallet/src/features/notifications/components/CopyFailedNotification'
import { DefaultNotification } from 'wallet/src/features/notifications/components/DefaultNotification'
import { ErrorNotification } from 'wallet/src/features/notifications/components/ErrorNotification'
import { SuccessNotification } from 'wallet/src/features/notifications/components/SuccessNotification'
import { SwapNetworkNotification } from 'wallet/src/features/notifications/components/SwapNetworkNotification'
import { SwapNotification } from 'wallet/src/features/notifications/components/SwapNotification'
import { SwapPendingNotification } from 'wallet/src/features/notifications/components/SwapPendingNotification'
import { TransferCurrencyNotification } from 'wallet/src/features/notifications/components/TransferCurrencyNotification'
import { TransferCurrencyPendingNotification } from 'wallet/src/features/notifications/components/TransferCurrencyPendingNotification'
import { TransferNFTNotification } from 'wallet/src/features/notifications/components/TransferNFTNotification'
import { UnknownTxNotification } from 'wallet/src/features/notifications/components/UnknownNotification'
import { WrapNotification } from 'wallet/src/features/notifications/components/WrapNotification'
import { AppNotification, AppNotificationType } from 'wallet/src/features/notifications/types'
import { TransactionType } from 'wallet/src/features/transactions/types'

export function SharedNotificationToastRouter({
  notification,
}: {
  notification: AppNotification
}): JSX.Element | null {
  switch (notification.type) {
    case AppNotificationType.Default:
      return <DefaultNotification notification={notification} />
    case AppNotificationType.AssetVisibility:
      return <ChangeAssetVisibilityNotification notification={notification} />
    case AppNotificationType.Copied:
      return <CopiedNotification notification={notification} />
    case AppNotificationType.CopyFailed:
      return <CopyFailedNotification notification={notification} />
    case AppNotificationType.Success:
      return <SuccessNotification notification={notification} />
    case AppNotificationType.Error:
      return <ErrorNotification notification={notification} />
    case AppNotificationType.ChooseCountry:
      return <ChooseCountryNotification notification={notification} />
    case AppNotificationType.SwapNetwork:
      return <SwapNetworkNotification notification={notification} />
    case AppNotificationType.SwapPending:
      return <SwapPendingNotification notification={notification} />
    case AppNotificationType.TransferCurrencyPending:
      return <TransferCurrencyPendingNotification notification={notification} />
    case AppNotificationType.Transaction:
      switch (notification.txType) {
        case TransactionType.Approve:
          return <ApproveNotification notification={notification} />
        case TransactionType.Swap:
          return <SwapNotification notification={notification} />
        case TransactionType.Wrap:
          return <WrapNotification notification={notification} />
        case TransactionType.Unknown:
          return <UnknownTxNotification notification={notification} />
        case TransactionType.Send:
        case TransactionType.Receive:
          if (notification.assetType === AssetType.Currency) {
            return <TransferCurrencyNotification notification={notification} />
          } else {
            return <TransferNFTNotification notification={notification} />
          }
      }
  }

  return null
}
