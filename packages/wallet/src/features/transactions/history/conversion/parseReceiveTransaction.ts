import { SpamCode } from 'uniswap/src/data/types'
import { AssetType } from 'uniswap/src/entities/assets'
import {
  ReceiveTokenTransactionInfo,
  TransactionDetailsType,
  TransactionListQueryResponse,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import {
  deriveCurrencyAmountFromAssetResponse,
  getAddressFromAsset,
  parseUSDValueFromAssetChange,
} from 'wallet/src/features/transactions/history/utils'

export default function parseReceiveTransaction(
  transaction: NonNullable<TransactionListQueryResponse>,
): ReceiveTokenTransactionInfo | undefined {
  if (transaction.details.__typename !== TransactionDetailsType.Transaction) {
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
      const sender = change.sender
      const name = change.asset?.name
      const tokenAddress = change.asset.nftContract?.address
      const collectionName = change.asset?.collection?.name
      const imageURL = change.asset.image?.url
      const tokenId = change.asset.tokenId
      const isSpam = change.asset?.isSpam ?? false

      if (!(sender && tokenAddress && collectionName && imageURL && name && tokenId)) {
        return undefined
      }
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
          address: tokenAddress,
        },
        isSpam,
      }
    }
  }

  // Found ERC20 transfer
  if (change.__typename === 'TokenTransfer') {
    const sender = change.sender

    const tokenAddress = getAddressFromAsset({
      chain: change.asset.chain,
      address: change.asset.address,
      tokenStandard: change.tokenStandard,
    })

    const currencyAmountRaw = deriveCurrencyAmountFromAssetResponse(
      change.tokenStandard,
      change.asset.chain,
      change.asset.address,
      change.asset.decimals,
      change.quantity,
    )

    const transactedUSDValue = parseUSDValueFromAssetChange(change.transactedValue)

    // Filter out receive transactions with tokens that are either marked `isSpam` or with spam code 2 (token with URL name)
    const isSpam = Boolean(change.asset.project?.isSpam || change.asset.project?.spamCode === SpamCode.HIGH)

    if (!(sender && tokenAddress)) {
      return undefined
    }

    return {
      type: TransactionType.Receive,
      assetType: AssetType.Currency,
      tokenAddress,
      sender,
      currencyAmountRaw,
      transactedUSDValue,
      isSpam,
    } as ReceiveTokenTransactionInfo
  }

  return undefined
}
