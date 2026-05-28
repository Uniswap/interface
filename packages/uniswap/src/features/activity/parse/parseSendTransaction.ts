import { Nft, OnChainTransaction, Token } from '@uniswap/client-data-api/dist/data/v1/types_pb'
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
  SendTokenTransactionInfo,
  TransactionDetailsType,
  TransactionListQueryResponse,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'

export default function parseSendTransaction(
  transaction: NonNullable<TransactionListQueryResponse>,
): SendTokenTransactionInfo | undefined {
  if (transaction.details.__typename !== TransactionDetailsType.Transaction) {
    return undefined
  }

  let change = transaction.details.assetChanges[0]

  // For some NFT transfers, the first assetChange is an NftApproval followed by an NftTransfer
  if (
    change?.__typename === 'NftApproval' &&
    transaction.details.assetChanges.length &&
    transaction.details.assetChanges.length > 1
  ) {
    change = transaction.details.assetChanges[1]
  }

  if (!change) {
    return undefined
  }

  // Found NFT transfer
  if (change.__typename === 'NftTransfer') {
    const assetType = change.nftStandard === 'ERC1155' ? AssetType.ERC1155 : AssetType.ERC721
    const recipient = change.recipient
    const name = change.asset.name
    const tokenAddress = change.asset.nftContract?.address
    const collectionName = change.asset.collection?.name
    const imageURL = change.asset.image?.url
    const tokenId = change.asset.tokenId
    const isSpam = Boolean(change.asset.isSpam)
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
  // Found ERC20 transfer
  if (change.__typename === 'TokenTransfer') {
    const tokenAddress = getAddressFromAsset({
      chain: change.asset.chain,
      address: change.asset.address,
      tokenStandard: change.tokenStandard,
    })

    const recipient = change.recipient
    const currencyAmountRaw = deriveCurrencyAmountFromAssetResponse({
      tokenStandard: change.tokenStandard,
      chain: change.asset.chain,
      address: change.asset.address,
      decimals: change.asset.decimals,
      quantity: change.quantity,
    })
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

/**
 * Parse a send transaction from the REST API
 */
export function parseRestSendTransaction(transaction: OnChainTransaction): SendTokenTransactionInfo | undefined {
  const { transfers } = transaction
  const firstTransfer = transfers[0]
  if (!firstTransfer) {
    return undefined
  }

  let asset: Token | Nft | undefined
  let isSpam = false

  if (firstTransfer.asset.case === AssetCase.Nft) {
    asset = firstTransfer.asset.value
    isSpam = asset.isSpam
  }

  if (firstTransfer.asset.case === AssetCase.Token) {
    asset = firstTransfer.asset.value
    isSpam = isRestTokenSpam(asset.metadata?.spamCode)
  }

  const assetType = mapTokenTypeToAssetType(asset?.type)

  return {
    type: TransactionType.Send,
    assetType,
    tokenAddress: asset?.address ?? '',
    currencyAmountRaw: firstTransfer.amount?.raw ?? '',
    recipient: firstTransfer.to,
    transactedUSDValue: undefined,
    isSpam,
    dappInfo: extractDappInfo(transaction),
  }
}
