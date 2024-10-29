import { SpamCode } from 'uniswap/src/data/types'
import { AssetType } from 'uniswap/src/entities/assets'
import {
  SendTokenTransactionInfo,
  TransactionDetailsType,
  TransactionListQueryResponse,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import {
  deriveCurrencyAmountFromAssetResponse,
  getAddressFromAsset,
  parseUSDValueFromAssetChange,
} from 'wallet/src/features/transactions/history/utils'

export default function parseSendTransaction(
  transaction: NonNullable<TransactionListQueryResponse>,
): SendTokenTransactionInfo | undefined {
  if (transaction.details.__typename !== TransactionDetailsType.Transaction) {
    return undefined
  }

  let change = transaction.details.assetChanges?.[0]

  // For some NFT transfers, the first assetChange is an NftApproval followed by an NftTransfer
  if (
    change?.__typename === 'NftApproval' &&
    transaction.details.assetChanges?.length &&
    transaction.details.assetChanges.length > 1
  ) {
    change = transaction.details.assetChanges[1]
  }

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
      const isSpam = Boolean(change.asset?.isSpam)
      if (!(recipient && tokenAddress && collectionName && imageURL && name && tokenId)) {
        return undefined
      }
      return {
        type: TransactionType.Send,
        assetType,
        tokenAddress,
        recipient,
        isSpam,
        nftSummaryInfo: {
          name,
          collectionName,
          imageURL,
          tokenId,
          address: tokenAddress,
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
      change.quantity,
    )
    const transactedUSDValue = parseUSDValueFromAssetChange(change.transactedValue)

    // Filter out send transactions with tokens that are either marked `isSpam` or with spam code 2 (token with URL name)
    // because send txs can be spoofed with spam tokens
    const isSpam = Boolean(change.asset.project?.isSpam || change.asset.project?.spamCode === SpamCode.HIGH)

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
