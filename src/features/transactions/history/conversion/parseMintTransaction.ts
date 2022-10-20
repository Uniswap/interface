import { BigNumber } from 'ethers'
import { parseUnits } from 'ethers/lib/utils'
import { ChainId } from 'src/constants/chains'
import { nativeOnChain } from 'src/constants/tokens'
import { parseUSDValueFromAssetChange } from 'src/features/transactions/history/utils'
import { NFTMintTransactionInfo, TransactionType } from 'src/features/transactions/types'
import { ActivityScreenQueryResponse } from 'src/screens/ActivityScreen'
import { ExternalProfileScreenQueryResponse } from 'src/screens/ExternalProfileScreen'
import { buildCurrencyId, buildNativeCurrencyId } from 'src/utils/currencyId'

export default function parseNFTMintTransaction(
  transaction: ActivityScreenQueryResponse | ExternalProfileScreenQueryResponse
): NFTMintTransactionInfo | undefined {
  const nativeCurrency = nativeOnChain(ChainId.Mainnet)
  const tokenChange = transaction?.assetChanges.find(
    (change) => change?.__typename === 'TokenTransfer'
  )
  const nftChange = transaction?.assetChanges.find((change) => change?.__typename === 'NftTransfer')

  // Mints must include the NFT minted
  if (!nftChange || nftChange.__typename !== 'NftTransfer') return undefined

  const name = nftChange.asset.name
  const collectionName = nftChange.asset.collection?.name
  const imageURL = nftChange.asset.imageUrl
  const tokenId = nftChange.asset.tokenId
  let transactedUSDValue: number | undefined

  if (!name || !collectionName || !imageURL || !tokenId) return undefined

  let purchaseCurrencyId: string | undefined
  let purchaseCurrencyAmountRaw: string | undefined
  if (tokenChange && tokenChange.__typename === 'TokenTransfer') {
    purchaseCurrencyId =
      tokenChange.tokenStandard === 'NATIVE'
        ? buildNativeCurrencyId(ChainId.Mainnet)
        : tokenChange.asset?.address
        ? buildCurrencyId(ChainId.Mainnet, tokenChange.asset.address)
        : undefined
    purchaseCurrencyAmountRaw = parseUnits(
      tokenChange.quantity,
      BigNumber.from(
        tokenChange.tokenStandard === 'NATIVE'
          ? nativeCurrency.decimals
          : tokenChange.asset.decimals
      )
    ).toString()

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
  }
}
