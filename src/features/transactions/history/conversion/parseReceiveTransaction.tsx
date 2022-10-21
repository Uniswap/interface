import { TransactionListQueryResponse } from 'src/components/TransactionList/TransactionList'
import { AssetType } from 'src/entities/assets'
import {
  deriveCurrencyAmountFromAssetResponse,
  parseUSDValueFromAssetChange,
} from 'src/features/transactions/history/utils'
import { ReceiveTokenTransactionInfo, TransactionType } from 'src/features/transactions/types'

export default function parseReceiveTransaction(
  transaction: TransactionListQueryResponse
): ReceiveTokenTransactionInfo | undefined {
  const change = transaction?.assetChanges[0]

  if (!change) return undefined

  // Found NFT transfer
  if (change.__typename === 'NftTransfer') {
    if (change.nftStandard) {
      const assetType = change.nftStandard === 'ERC1155' ? AssetType.ERC1155 : AssetType.ERC721
      const sender = change.sender
      const name = change.asset?.name
      const tokenAddress = change.asset.nftContract?.address
      const collectionName = change.asset?.collection?.name
      const imageURL = change.asset.imageUrl
      const tokenId = change.asset.tokenId
      if (!(sender && tokenAddress && collectionName && imageURL && name && tokenId))
        return undefined
      return {
        type: TransactionType.Receive,
        assetType,
        tokenAddress,
        sender,
        nftSummaryInfo: {
          name,
          collectionName,
          imageURL,
          tokenId,
        },
      }
    }
  }

  // Found ERC20 transfer
  if (change.__typename === 'TokenTransfer') {
    const tokenAddress = change.asset?.address
    const sender = change.sender
    const currencyAmountRaw = deriveCurrencyAmountFromAssetResponse(
      change.tokenStandard,
      change.asset,
      change.quantity
    )

    const transactedUSDValue = parseUSDValueFromAssetChange(change.transactedValue)

    if (!(sender && tokenAddress)) return undefined
    return {
      type: TransactionType.Receive,
      assetType: AssetType.Currency,
      tokenAddress,
      sender,
      currencyAmountRaw,
      transactedUSDValue,
    }
  }

  return undefined
}
