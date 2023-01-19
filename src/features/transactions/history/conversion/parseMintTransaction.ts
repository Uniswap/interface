import { BigNumber } from 'ethers'
import { parseUnits } from 'ethers/lib/utils'
import { TransactionListQueryResponse } from 'src/components/TransactionList/TransactionList'
import { ChainId } from 'src/constants/chains'
import { NativeCurrency } from 'src/features/tokens/NativeCurrency'
import { parseUSDValueFromAssetChange } from 'src/features/transactions/history/utils'
import { NFTMintTransactionInfo, TransactionType } from 'src/features/transactions/types'
import { buildCurrencyId, buildNativeCurrencyId } from 'src/utils/currencyId'

export default function parseNFTMintTransaction(
  transaction: TransactionListQueryResponse
): NFTMintTransactionInfo | undefined {
  const nativeCurrency = NativeCurrency.onChain(ChainId.Mainnet)
  const tokenChange = transaction?.assetChanges.find(
    (change) => change?.__typename === 'TokenTransfer'
  )
  const nftChange = transaction?.assetChanges.find((change) => change?.__typename === 'NftTransfer')

  // Mints must include the NFT minted
  if (!nftChange || nftChange.__typename !== 'NftTransfer') return undefined

  const name = nftChange.asset.name
  const collectionName = nftChange.asset.collection?.name
  const imageURL = nftChange.asset.image?.url
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
