/* eslint-disable complexity */
import { AssetType } from 'uniswap/src/entities/assets'
import { AppNotification, AppNotificationType } from 'uniswap/src/features/notifications/types'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { ApproveNotification } from 'wallet/src/features/notifications/components/ApproveNotification'
import { BridgeNotification } from 'wallet/src/features/notifications/components/BridgeNotification'
import { ChangeAssetVisibilityNotification } from 'wallet/src/features/notifications/components/ChangeAssetVisibilityNotification'
import { ChooseCountryNotification } from 'wallet/src/features/notifications/components/ChooseCountryNotification'
import { CopiedNotification } from 'wallet/src/features/notifications/components/CopiedNotification'
import { CopyFailedNotification } from 'wallet/src/features/notifications/components/CopyFailedNotification'
import { DefaultNotification } from 'wallet/src/features/notifications/components/DefaultNotification'
import { ErrorNotification } from 'wallet/src/features/notifications/components/ErrorNotification'
import { NetworkChangedBridgeNotification } from 'wallet/src/features/notifications/components/NetworkChangedBridgeNotification'
import { NetworkChangedNotification } from 'wallet/src/features/notifications/components/NetworkChangedNotification'
import { SuccessNotification } from 'wallet/src/features/notifications/components/SuccessNotification'
import { SwapNotification } from 'wallet/src/features/notifications/components/SwapNotification'
import { SwapPendingNotification } from 'wallet/src/features/notifications/components/SwapPendingNotification'
import { TransactionPendingNotification } from 'wallet/src/features/notifications/components/TransactionPendingNotification'
import { TransferCurrencyNotification } from 'wallet/src/features/notifications/components/TransferCurrencyNotification'
import { TransferCurrencyPendingNotification } from 'wallet/src/features/notifications/components/TransferCurrencyPendingNotification'
import { TransferNFTNotification } from 'wallet/src/features/notifications/components/TransferNFTNotification'
import { UnknownTxNotification } from 'wallet/src/features/notifications/components/UnknownNotification'
import { WrapNotification } from 'wallet/src/features/notifications/components/WrapNotification'

// Update name in `packages/wallet/src/components/ErrorBoundary/ErrorBoundary.tsx` if we update here
export function SharedNotificationToastRouter({ notification }: { notification: AppNotification }): JSX.Element | null {
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
    case AppNotificationType.NetworkChanged:
      return <NetworkChangedNotification notification={notification} />
    case AppNotificationType.NetworkChangedBridge:
      return <NetworkChangedBridgeNotification notification={notification} />
    case AppNotificationType.SwapPending:
      return <SwapPendingNotification notification={notification} />
    case AppNotificationType.TransferCurrencyPending:
      return <TransferCurrencyPendingNotification />
    case AppNotificationType.TransactionPending:
      return <TransactionPendingNotification />
    case AppNotificationType.Transaction:
      switch (notification.txType) {
        case TransactionType.Approve:
          return <ApproveNotification notification={notification} />
        case TransactionType.Bridge:
          return <BridgeNotification notification={notification} />
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
