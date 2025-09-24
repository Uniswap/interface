import { put, select, takeLatest } from 'typed-redux-saga'
import { AssetType } from 'uniswap/src/entities/assets'
import { STALE_TRANSACTION_TIME_MS } from 'uniswap/src/features/notifications/constants'
import { makeSelectAddressNotifications } from 'uniswap/src/features/notifications/slice/selectors'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotification, AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { finalizeTransaction } from 'uniswap/src/features/transactions/slice'
import { getAmountsFromTrade } from 'uniswap/src/features/transactions/swap/utils/getAmountsFromTrade'
import {
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { UniswapState } from 'uniswap/src/state/uniswapReducer'
import { WalletConnectEvent } from 'uniswap/src/types/walletConnect'
import { buildReceiveNotification } from 'wallet/src/features/notifications/buildReceiveNotification'
import { selectActiveAccountAddress } from 'wallet/src/features/wallet/selectors'

export function* notificationWatcher() {
  yield* takeLatest(finalizeTransaction.type, pushTransactionNotification)
}

export function* pushTransactionNotification(action: ReturnType<typeof finalizeTransaction>) {
  const activeAddress = yield* select(selectActiveAccountAddress)
  const existingNotifications = yield* select((state: UniswapState) =>
    makeSelectAddressNotifications()(state, activeAddress),
  )
  if (shouldSuppressNotification({ tx: action.payload, existingNotifications })) {
    return
  }

  const { chainId, status, typeInfo, id, from } = action.payload

  const baseNotificationData = {
    txStatus: status,
    chainId,
    address: from,
    txId: id,
  }

  if (typeInfo.type === TransactionType.Approve) {
    yield* put(
      pushNotification({
        ...baseNotificationData,
        type: AppNotificationType.Transaction,
        txType: TransactionType.Approve,
        tokenAddress: typeInfo.tokenAddress,
        spender: typeInfo.spender,
      }),
    )
  } else if (typeInfo.type === TransactionType.Bridge) {
    const { inputCurrencyAmountRaw, outputCurrencyAmountRaw } = getAmountsFromTrade(typeInfo)
    yield* put(
      pushNotification({
        ...baseNotificationData,
        type: AppNotificationType.Transaction,
        txType: TransactionType.Bridge,
        inputCurrencyId: typeInfo.inputCurrencyId,
        outputCurrencyId: typeInfo.outputCurrencyId,
        inputCurrencyAmountRaw,
        outputCurrencyAmountRaw,
      }),
    )
  } else if (typeInfo.type === TransactionType.Swap) {
    const { inputCurrencyAmountRaw, outputCurrencyAmountRaw } = getAmountsFromTrade(typeInfo)
    yield* put(
      pushNotification({
        ...baseNotificationData,
        type: AppNotificationType.Transaction,
        txType: TransactionType.Swap,
        inputCurrencyId: typeInfo.inputCurrencyId,
        outputCurrencyId: typeInfo.outputCurrencyId,
        inputCurrencyAmountRaw,
        outputCurrencyAmountRaw,
        tradeType: typeInfo.tradeType,
      }),
    )
  } else if (typeInfo.type === TransactionType.Wrap) {
    yield* put(
      pushNotification({
        ...baseNotificationData,
        type: AppNotificationType.Transaction,
        txType: TransactionType.Wrap,
        currencyAmountRaw: typeInfo.currencyAmountRaw,
        unwrapped: typeInfo.unwrapped,
      }),
    )
  } else if (typeInfo.type === TransactionType.Send) {
    if (typeInfo.assetType === AssetType.Currency && typeInfo.currencyAmountRaw) {
      yield* put(
        pushNotification({
          ...baseNotificationData,
          type: AppNotificationType.Transaction,
          txType: TransactionType.Send,
          assetType: typeInfo.assetType,
          tokenAddress: typeInfo.tokenAddress,
          currencyAmountRaw: typeInfo.currencyAmountRaw,
          recipient: typeInfo.recipient,
        }),
      )
    } else if (
      (typeInfo.assetType === AssetType.ERC1155 || typeInfo.assetType === AssetType.ERC721) &&
      typeInfo.tokenId
    ) {
      yield* put(
        pushNotification({
          ...baseNotificationData,
          type: AppNotificationType.Transaction,
          txType: TransactionType.Send,
          assetType: typeInfo.assetType,
          tokenAddress: typeInfo.tokenAddress,
          tokenId: typeInfo.tokenId,
          recipient: typeInfo.recipient,
        }),
      )
    }
  } else if (typeInfo.type === TransactionType.Receive) {
    const receiveNotification = buildReceiveNotification(action.payload, from)
    if (receiveNotification) {
      yield* put(pushNotification(receiveNotification))
    }
  } else if (typeInfo.type === TransactionType.WCConfirm) {
    yield* put(
      pushNotification({
        type: AppNotificationType.WalletConnect,
        event:
          status === TransactionStatus.Failed
            ? WalletConnectEvent.TransactionFailed
            : WalletConnectEvent.TransactionConfirmed,
        dappName: typeInfo.dappRequestInfo.name,
        imageUrl: typeInfo.dappRequestInfo.icon ?? null,
        chainId,
      }),
    )
  } else if (typeInfo.type === TransactionType.Unknown) {
    yield* put(
      pushNotification({
        ...baseNotificationData,
        type: AppNotificationType.Transaction,
        txType: TransactionType.Unknown,
        tokenAddress: typeInfo.tokenAddress,
      }),
    )
  }
}

export function shouldSuppressNotification({
  tx,
  existingNotifications,
}: {
  tx: TransactionDetails
  existingNotifications?: AppNotification[]
}) {
  if (existingNotifications) {
    // For bridging, we may update transaction details (such as sendConfirmed field), but this shouldn't trigger a new notification
    const existingBridgeNotification = existingNotifications.find(
      (notification) =>
        notification.type === AppNotificationType.Transaction &&
        notification.txType === TransactionType.Bridge &&
        notification.txId === tx.id,
    )
    if (existingBridgeNotification) {
      return true
    }
  }

  const staleTransaction = Date.now() > tx.addedTime + STALE_TRANSACTION_TIME_MS

  // If a wrap or approve tx is submitted with a swap, then suppress the notification.
  const chainedTransaction =
    (tx.typeInfo.type === TransactionType.Approve || tx.typeInfo.type === TransactionType.Wrap) && tx.typeInfo.swapTxId
  return chainedTransaction || staleTransaction
}
