import { OnChainTransaction } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { AssetType } from 'uniswap/src/entities/assets'
import { extractDappInfo } from 'uniswap/src/features/activity/utils/extractDappInfo'
import { AssetCase, isRestTokenSpam, mapTokenTypeToAssetType } from 'uniswap/src/features/activity/utils/remote'
import {
  ReceiveTokenTransactionInfo,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'

export function parseReceiveTransaction(transaction: OnChainTransaction): ReceiveTokenTransactionInfo | undefined {
  const { transfers } = transaction
  const firstTransfer = transfers[0]

  if (!firstTransfer) {
    return undefined
  }

  if (firstTransfer.asset.case === AssetCase.Nft) {
    const nftAsset = firstTransfer.asset.value
    const sender = firstTransfer.from
    const tokenAddress = nftAsset.address
    const tokenId = nftAsset.tokenId

    if (!(sender && tokenAddress && tokenId)) {
      return undefined
    }

    return {
      type: TransactionType.Receive,
      assetType: mapTokenTypeToAssetType(nftAsset.type),
      tokenAddress,
      sender,
      nftSummaryInfo: {
        name: nftAsset.name,
        collectionName: nftAsset.collectionName,
        imageURL: nftAsset.imageUrl,
        tokenId,
        address: tokenAddress,
      },
      isSpam: nftAsset.isSpam,
      dappInfo: extractDappInfo(transaction),
    }
  }

  if (firstTransfer.asset.case === AssetCase.Token) {
    const tokenAsset = firstTransfer.asset.value
    const tokenAddress = tokenAsset.address
    const sender = firstTransfer.from

    if (!(sender && tokenAddress)) {
      return undefined
    }

    return {
      type: TransactionType.Receive,
      assetType: AssetType.Currency,
      tokenAddress,
      sender,
      currencyAmountRaw: firstTransfer.amount?.raw,
      transactedUSDValue: undefined,
      isSpam: isRestTokenSpam(tokenAsset.metadata?.spamCode),
      dappInfo: extractDappInfo(transaction),
    }
  }
  return undefined
}
