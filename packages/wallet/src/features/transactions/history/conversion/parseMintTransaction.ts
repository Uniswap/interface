import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import {
  NFTMintTransactionInfo,
  TransactionDetailsType,
  TransactionListQueryResponse,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { buildCurrencyId, buildNativeCurrencyId } from 'uniswap/src/utils/currencyId'
import {
  deriveCurrencyAmountFromAssetResponse,
  parseUSDValueFromAssetChange,
} from 'wallet/src/features/transactions/history/utils'

export default function parseNFTMintTransaction(
  transaction: NonNullable<TransactionListQueryResponse>,
): NFTMintTransactionInfo | undefined {
  if (transaction.details.__typename !== TransactionDetailsType.Transaction) {
    return undefined
  }

  const tokenChange = transaction.details.assetChanges?.find((change) => change?.__typename === 'TokenTransfer')
  const nftChange = transaction.details.assetChanges?.find((change) => change?.__typename === 'NftTransfer')

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
  const address = nftChange.asset.nftContract?.address

  let transactedUSDValue: number | undefined

  if (!name || !collectionName || !imageURL || !tokenId || !chainId || !address) {
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
      tokenChange.quantity,
    )

    transactedUSDValue = parseUSDValueFromAssetChange(tokenChange.transactedValue)
  }

  const dappInfo = transaction.details.application?.address
    ? {
        name: transaction.details.application?.name,
        address: transaction.details.application.address,
        icon: transaction.details.application?.icon?.url,
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
