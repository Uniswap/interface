import { SpamCode } from 'wallet/src/data/types'
import { AssetType } from 'wallet/src/entities/assets'
import {
  deriveCurrencyAmountFromAssetResponse,
  getAddressFromAsset,
  parseUSDValueFromAssetChange,
} from 'wallet/src/features/transactions/history/utils'
import {
  SendTokenTransactionInfo,
  TransactionListQueryResponse,
  TransactionType,
} from 'wallet/src/features/transactions/types'

export default function parseSendTransaction(
  transaction: NonNullable<TransactionListQueryResponse>
): SendTokenTransactionInfo | undefined {
  if (transaction.details.__typename !== 'TransactionDetails') {
    return undefined
  }

  const change = transaction.details.assetChanges?.[0]

  if (!change) {
    return undefined
  }

  // Found NFT transfer
  if (change.__typename === 'NftTransfer') {
    if (change.nftStandard) {
      const assetType = change.nftStandard === 'ERC1155' ? AssetType.ERC1155 : AssetType.ERC721
      const recipient = change.recipient
      const name = change.asset?.name
      const tokenAddress = change.asset?.nftContract?.address
      const collectionName = change.asset?.collection?.name
      const imageURL = change.asset?.image?.url
      const tokenId = change.asset?.tokenId
      if (!(recipient && tokenAddress && collectionName && imageURL && name && tokenId)) {
        return undefined
      }
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
    const tokenAddress = getAddressFromAsset({
      chain: change.asset.chain,
      address: change.asset.address,
      tokenStandard: change.tokenStandard,
    })
    const recipient = change.recipient
    const currencyAmountRaw = deriveCurrencyAmountFromAssetResponse(
      change.tokenStandard,
      change.asset.chain,
      change.asset.address,
      change.asset.decimals,
      change.quantity
    )
    const transactedUSDValue = parseUSDValueFromAssetChange(change.transactedValue)

    // Filter out send transactions with tokens that have spamCode 2 (token with URL name)
    const isSpam = Boolean(change.asset.project?.spamCode === SpamCode.HIGH)

    if (!(recipient && tokenAddress)) {
      return undefined
    }

    return {
      type: TransactionType.Send,
      assetType: AssetType.Currency,
      tokenAddress,
      recipient,
      currencyAmountRaw,
      transactedUSDValue,
      isSpam,
    }
  }

  return undefined
}
