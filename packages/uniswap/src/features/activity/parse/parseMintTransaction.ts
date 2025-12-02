import { OnChainTransaction } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { extractDappInfo } from 'uniswap/src/features/activity/utils/extractDappInfo'
import {
  deriveCurrencyAmountFromAssetResponse,
  parseUSDValueFromAssetChange,
} from 'uniswap/src/features/activity/utils/remote'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import {
  NFTMintTransactionInfo,
  TransactionDetailsType,
  TransactionListQueryResponse,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { buildCurrencyId, buildNativeCurrencyId } from 'uniswap/src/utils/currencyId'

export default function parseNFTMintTransaction(
  transaction: NonNullable<TransactionListQueryResponse>,
): NFTMintTransactionInfo | undefined {
  if (transaction.details.__typename !== TransactionDetailsType.Transaction) {
    return undefined
  }

  const tokenChange = transaction.details.assetChanges.find((change) => change?.__typename === 'TokenTransfer')
  const nftChange = transaction.details.assetChanges.find((change) => change?.__typename === 'NftTransfer')

  // Mints must include the NFT minted
  if (nftChange?.__typename !== 'NftTransfer') {
    return undefined
  }

  const name = nftChange.asset.name
  const collectionName = nftChange.asset.collection?.name
  const imageURL = nftChange.asset.image?.url
  const tokenId = nftChange.asset.tokenId
  const chainId = fromGraphQLChain(transaction.chain)
  const isSpam = nftChange.asset.isSpam ?? false
  const address = nftChange.asset.nftContract?.address

  let transactedUSDValue: number | undefined

  if (!name || !collectionName || !imageURL || !tokenId || !chainId || !address) {
    return undefined
  }

  let purchaseCurrencyId: string | undefined
  let purchaseCurrencyAmountRaw: string | undefined
  if (tokenChange?.__typename === 'TokenTransfer') {
    purchaseCurrencyId =
      tokenChange.tokenStandard === 'NATIVE'
        ? buildNativeCurrencyId(chainId)
        : tokenChange.asset.address
          ? buildCurrencyId(chainId, tokenChange.asset.address)
          : undefined
    purchaseCurrencyAmountRaw = deriveCurrencyAmountFromAssetResponse({
      tokenStandard: tokenChange.tokenStandard,
      chain: tokenChange.asset.chain,
      address: tokenChange.asset.address,
      decimals: tokenChange.asset.decimals,
      quantity: tokenChange.quantity,
    })

    transactedUSDValue = parseUSDValueFromAssetChange(tokenChange.transactedValue)
  }

  const dappInfo = transaction.details.application?.address
    ? {
        name: transaction.details.application.name,
        address: transaction.details.application.address,
        icon: transaction.details.application.icon?.url,
      }
    : undefined
  return {
    type: TransactionType.NFTMint,
    nftSummaryInfo: {
      name,
      collectionName,
      imageURL,
      tokenId,
      address,
    },
    purchaseCurrencyId,
    purchaseCurrencyAmountRaw,
    transactedUSDValue,
    isSpam,
    dappInfo,
  }
}

/**
 * Parse an NFT mint transaction from the REST API
 */
export function parseRestNFTMintTransaction(transaction: OnChainTransaction): NFTMintTransactionInfo | undefined {
  const { transfers } = transaction
  const firstTransfer = transfers[0]
  if (!firstTransfer || firstTransfer.asset.case !== 'nft') {
    return undefined
  }
  const nftTransfer = firstTransfer.asset.value
  const { tokenId, address } = nftTransfer
  if (!tokenId || !address) {
    return undefined
  }
  return {
    type: TransactionType.NFTMint,
    nftSummaryInfo: {
      name: nftTransfer.name,
      collectionName: nftTransfer.collectionName,
      imageURL: nftTransfer.imageUrl,
      tokenId,
      address,
    },
    purchaseCurrencyId: buildCurrencyId(nftTransfer.chainId, address),
    purchaseCurrencyAmountRaw: transaction.fee?.amount?.raw,
    transactedUSDValue: undefined,
    dappInfo: extractDappInfo(transaction),
    isSpam: nftTransfer.isSpam,
  }
}
