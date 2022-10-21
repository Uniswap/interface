import { TransactionListQueryResponse } from 'src/components/TransactionList/TransactionList'
import { AssetType } from 'src/entities/assets'
import {
  deriveCurrencyAmountFromAssetResponse,
  parseUSDValueFromAssetChange,
} from 'src/features/transactions/history/utils'
import { SendTokenTransactionInfo, TransactionType } from 'src/features/transactions/types'

export default function parseSendTransaction(
  transaction: TransactionListQueryResponse
): SendTokenTransactionInfo | undefined {
  const change = transaction?.assetChanges[0]

  if (!change) return undefined

  // Found NFT transfer
  if (change.__typename === 'NftTransfer') {
    if (change.nftStandard) {
      const assetType = change.nftStandard === 'ERC1155' ? AssetType.ERC1155 : AssetType.ERC721
      const recipient = change.recipient
      const name = change.asset?.name
      const tokenAddress = change.asset?.nftContract?.address
      const collectionName = change.asset?.collection?.name
      const imageURL = change.asset?.imageUrl
      const tokenId = change.asset?.tokenId
      if (!(recipient && tokenAddress && collectionName && imageURL && name && tokenId))
        return undefined
      return {
        type: TransactionType.Send,
        assetType,
        tokenAddress,
        recipient,
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
    if (change.tokenStandard) {
      const tokenAddress = change.asset?.address
      const recipient = change.recipient
      const currencyAmountRaw = deriveCurrencyAmountFromAssetResponse(
        change.tokenStandard,
        change.asset,
        change.quantity
      )
      const transactedUSDValue = parseUSDValueFromAssetChange(change.transactedValue)

      if (!(recipient && tokenAddress)) return undefined
      return {
        type: TransactionType.Send,
        assetType: AssetType.Currency,
        tokenAddress,
        recipient,
        currencyAmountRaw,
        transactedUSDValue,
      }
    }
  }

  return undefined
}
