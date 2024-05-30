import { AssetType } from 'wallet/src/entities/assets'
import {
  AppNotificationType,
  ReceiveCurrencyTxNotification,
  ReceiveNFTNotification,
} from 'wallet/src/features/notifications/types'
import {
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'wallet/src/features/transactions/types'

/**
 * Based on notification type info, returns an AppNotification object for either NFT or Currency receive.
 * Must be a 'Receive' type transaction.
 *
 * Returns undefined if not all data is found for either Currency or NFT case, or if transaction is not
 * the correct type.
 */

export function buildReceiveNotification(
  transactionDetails: TransactionDetails,
  receivingAddress: Address // not included in transactionDetails
): ReceiveNFTNotification | ReceiveCurrencyTxNotification | undefined {
  const { typeInfo, status, chainId, hash, id } = transactionDetails

  // Only build notification object on successful receive transactions.
  if (status !== TransactionStatus.Success || typeInfo.type !== TransactionType.Receive || !hash) {
    return undefined
  }

  const baseNotificationData = {
    txStatus: status,
    chainId,
    txHash: hash,
    address: receivingAddress,
    txId: id,
  }

  // Currency receive txn.
  if (
    typeInfo?.assetType === AssetType.Currency &&
    typeInfo?.currencyAmountRaw &&
    typeInfo?.sender
  ) {
    return {
      ...baseNotificationData,
      type: AppNotificationType.Transaction,
      txType: TransactionType.Receive,
      assetType: typeInfo.assetType,
      tokenAddress: typeInfo.tokenAddress,
      currencyAmountRaw: typeInfo.currencyAmountRaw,
      sender: typeInfo.sender,
    }
  }

  // NFT receive txn.
  if (
    (typeInfo?.assetType === AssetType.ERC1155 || typeInfo?.assetType === AssetType.ERC721) &&
    typeInfo?.tokenId
  ) {
    return {
      ...baseNotificationData,
      type: AppNotificationType.Transaction,
      txType: TransactionType.Receive,
      assetType: typeInfo.assetType,
      tokenAddress: typeInfo.tokenAddress,
      tokenId: typeInfo.tokenId,
      sender: typeInfo.sender,
    }
  }

  return undefined
}
