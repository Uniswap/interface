import { TransactionListQueryResponse } from 'src/components/TransactionList/TransactionList'
import { AssetType } from 'src/entities/assets'
import {
  deriveCurrencyAmountFromAssetResponse,
  getAddressFromAsset,
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
    const tokenAddress = getAddressFromAsset({
      chain: change.asset.chain,
      address: change.asset.address,
      tokenStandard: change.tokenStandard,
    })

    const sender = change.sender
    const currencyAmountRaw = deriveCurrencyAmountFromAssetResponse(
      change.tokenStandard,
      change.quantity,
      change.asset.decimals
    )
    const transactedUSDValue = parseUSDValueFromAssetChange(change.transactedValue)

    const isSpam = Boolean(change.asset.project?.isSpam) ?? false

    if (!(sender && tokenAddress)) return undefined

    return {
      type: TransactionType.Receive,
      assetType: AssetType.Currency,
      tokenAddress,
      sender,
      currencyAmountRaw,
      transactedUSDValue,
      isSpam,
    }
  }

  return undefined
}
