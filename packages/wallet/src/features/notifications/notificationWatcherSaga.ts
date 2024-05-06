import { call, put, takeLatest } from 'typed-redux-saga'
import { ChainId } from 'wallet/src/constants/chains'
import { AssetType } from 'wallet/src/entities/assets'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import { getAmountsFromTrade } from 'wallet/src/features/transactions/getAmountsFromTrade'
import { selectTransactions } from 'wallet/src/features/transactions/selectors'
import { finalizeTransaction } from 'wallet/src/features/transactions/slice'
import { TransactionType } from 'wallet/src/features/transactions/types'
import { buildReceiveNotification } from './buildReceiveNotification'

import { WalletConnectEvent } from 'wallet/src/features/walletConnect/types'
import { appSelect } from 'wallet/src/state'

export function* notificationWatcher() {
  yield* takeLatest(finalizeTransaction.type, pushTransactionNotification)
}

export function* pushTransactionNotification(action: ReturnType<typeof finalizeTransaction>) {
  const { chainId, status, typeInfo, hash, id, from, addedTime } = action.payload

  const baseNotificationData = {
    txStatus: status,
    chainId,
    txHash: hash,
    address: from,
    txId: id,
  }

  if (typeInfo.type === TransactionType.Approve) {
    const shouldSuppressNotification = yield* call(
      suppressApproveNotification,
      from,
      chainId,
      addedTime
    )
    if (!shouldSuppressNotification) {
      yield* put(
        pushNotification({
          ...baseNotificationData,
          type: AppNotificationType.Transaction,
          txType: TransactionType.Approve,
          tokenAddress: typeInfo.tokenAddress,
          spender: typeInfo.spender,
        })
      )
    }
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
      })
    )
  } else if (typeInfo.type === TransactionType.Wrap) {
    yield* put(
      pushNotification({
        ...baseNotificationData,
        type: AppNotificationType.Transaction,
        txType: TransactionType.Wrap,
        currencyAmountRaw: typeInfo.currencyAmountRaw,
        unwrapped: typeInfo.unwrapped,
      })
    )
  } else if (typeInfo.type === TransactionType.Send) {
    if (typeInfo?.assetType === AssetType.Currency && typeInfo?.currencyAmountRaw) {
      yield* put(
        pushNotification({
          ...baseNotificationData,
          type: AppNotificationType.Transaction,
          txType: TransactionType.Send,
          assetType: typeInfo.assetType,
          tokenAddress: typeInfo.tokenAddress,
          currencyAmountRaw: typeInfo.currencyAmountRaw,
          recipient: typeInfo.recipient,
        })
      )
    } else if (
      (typeInfo?.assetType === AssetType.ERC1155 || typeInfo?.assetType === AssetType.ERC721) &&
      typeInfo?.tokenId
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
        })
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
        event: WalletConnectEvent.TransactionConfirmed,
        dappName: typeInfo.dapp.name,
        imageUrl: typeInfo.dapp.icon,
        chainId,
      })
    )
  } else if (typeInfo.type === TransactionType.Unknown) {
    yield* put(
      pushNotification({
        ...baseNotificationData,
        type: AppNotificationType.Transaction,
        txType: TransactionType.Unknown,
        tokenAddress: typeInfo?.tokenAddress,
      })
    )
  }
}

// If an approve tx is submitted with a swap tx (i.e, swap tx is added within 3 seconds of an approve tx),
// then suppress the approve notification
function* suppressApproveNotification(
  address: Address,
  chainId: ChainId,
  approveAddedTime: number
) {
  const transactions = (yield* appSelect(selectTransactions))?.[address]?.[chainId]
  const transactionDetails = Object.values(transactions ?? {})
  const foundSwapTx = transactionDetails.find((tx) => {
    const { type } = tx.typeInfo
    if (type !== TransactionType.Swap) {
      return false
    }

    const swapAddedTime = tx.addedTime
    return swapAddedTime - approveAddedTime < 3000
  })

  return !!foundSwapTx
}
