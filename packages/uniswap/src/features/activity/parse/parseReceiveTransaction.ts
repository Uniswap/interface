import { OnChainTransaction } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { SpamCode } from '@universe/api'
import { AssetType } from 'uniswap/src/entities/assets'
import { extractDappInfo } from 'uniswap/src/features/activity/utils/extractDappInfo'
import {
  AssetCase,
  deriveCurrencyAmountFromAssetResponse,
  getAddressFromAsset,
  isRestTokenSpam,
  mapTokenTypeToAssetType,
  parseUSDValueFromAssetChange,
} from 'uniswap/src/features/activity/utils/remote'
import {
  ReceiveTokenTransactionInfo,
  TransactionDetailsType,
  TransactionListQueryResponse,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'

export default function parseReceiveTransaction(
  transaction: NonNullable<TransactionListQueryResponse>,
): ReceiveTokenTransactionInfo | undefined {
  if (transaction.details.__typename !== TransactionDetailsType.Transaction) {
    return undefined
  }

  const change = transaction.details.assetChanges[0]

  if (!change) {
    return undefined
  }

  // Found NFT transfer
  if (change.__typename === 'NftTransfer') {
    const assetType = change.nftStandard === 'ERC1155' ? AssetType.ERC1155 : AssetType.ERC721
    const sender = change.sender
    const name = change.asset.name
    const tokenAddress = change.asset.nftContract?.address
    const collectionName = change.asset.collection?.name
    const imageURL = change.asset.image?.url
    const tokenId = change.asset.tokenId
    const isSpam = change.asset.isSpam ?? false

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

  // Found ERC20 transfer
  if (change.__typename === 'TokenTransfer') {
    const sender = change.sender

    const tokenAddress = getAddressFromAsset({
      chain: change.asset.chain,
      address: change.asset.address,
      tokenStandard: change.tokenStandard,
    })

    const currencyAmountRaw = deriveCurrencyAmountFromAssetResponse({
      tokenStandard: change.tokenStandard,
      chain: change.asset.chain,
      address: change.asset.address,
      decimals: change.asset.decimals,
      quantity: change.quantity,
    })

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

/**
 * Parse a receive transaction from the REST API
 */
export function parseRestReceiveTransaction(transaction: OnChainTransaction): ReceiveTokenTransactionInfo | undefined {
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
