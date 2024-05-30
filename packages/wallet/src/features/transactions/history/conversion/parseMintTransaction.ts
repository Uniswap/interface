import { fromGraphQLChain } from 'wallet/src/features/chains/utils'
import {
  deriveCurrencyAmountFromAssetResponse,
  parseUSDValueFromAssetChange,
} from 'wallet/src/features/transactions/history/utils'
import {
  NFTMintTransactionInfo,
  TransactionListQueryResponse,
  TransactionType,
} from 'wallet/src/features/transactions/types'
import { buildCurrencyId, buildNativeCurrencyId } from 'wallet/src/utils/currencyId'

export default function parseNFTMintTransaction(
  transaction: NonNullable<TransactionListQueryResponse>
): NFTMintTransactionInfo | undefined {
  if (transaction.details.__typename !== 'TransactionDetails') {
    return undefined
  }

  const tokenChange = transaction.details.assetChanges?.find(
    (change) => change?.__typename === 'TokenTransfer'
  )
  const nftChange = transaction.details.assetChanges?.find(
    (change) => change?.__typename === 'NftTransfer'
  )

  // Mints must include the NFT minted
  if (!nftChange || nftChange.__typename !== 'NftTransfer') {
    return undefined
  }

  const name = nftChange.asset.name
  const collectionName = nftChange.asset.collection?.name
  const imageURL = nftChange.asset.image?.url
  const tokenId = nftChange.asset.tokenId
  const chainId = fromGraphQLChain(transaction.chain)
  const isSpam = nftChange.asset?.isSpam ?? false

  let transactedUSDValue: number | undefined

  if (!name || !collectionName || !imageURL || !tokenId || !chainId) {
    return undefined
  }

  let purchaseCurrencyId: string | undefined
  let purchaseCurrencyAmountRaw: string | undefined
  if (tokenChange && tokenChange.__typename === 'TokenTransfer') {
    purchaseCurrencyId =
      tokenChange.tokenStandard === 'NATIVE'
        ? buildNativeCurrencyId(chainId)
        : tokenChange.asset?.address
        ? buildCurrencyId(chainId, tokenChange.asset.address)
        : undefined
    purchaseCurrencyAmountRaw = deriveCurrencyAmountFromAssetResponse(
      tokenChange.tokenStandard,
      tokenChange.asset.chain,
      tokenChange.asset.address,
      tokenChange.asset.decimals,
      tokenChange.quantity
    )

    transactedUSDValue = parseUSDValueFromAssetChange(tokenChange.transactedValue)
  }

  return {
    type: TransactionType.NFTMint,
    nftSummaryInfo: {
      name,
      collectionName,
      imageURL,
      tokenId,
    },
    purchaseCurrencyId,
    purchaseCurrencyAmountRaw,
    transactedUSDValue,
    isSpam,
  }
}
