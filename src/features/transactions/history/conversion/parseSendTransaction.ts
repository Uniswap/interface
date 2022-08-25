import { BigNumber } from 'ethers'
import { parseUnits } from 'ethers/lib/utils'
import { ChainId } from 'src/constants/chains'
import { nativeOnChain } from 'src/constants/tokens'
import { AssetType } from 'src/entities/assets'
import { TransactionHistoryResponse } from 'src/features/transactions/history/transactionHistory'
import { SendTokenTransactionInfo, TransactionType } from 'src/features/transactions/types'

export default function parseSendTransaction(
  transaction: Nullable<TransactionHistoryResponse>
): SendTokenTransactionInfo | undefined {
  const change = transaction?.assetChanges[0]
  const nativeCurrency = nativeOnChain(ChainId.Mainnet)
  if (!change) return undefined

  // Found NFT transfer
  if (change.__typename === 'NftTransfer') {
    if (change.nftStandard) {
      const assetType = change.nftStandard === 'ERC1155' ? AssetType.ERC1155 : AssetType.ERC721
      const recipient = change.recipient
      const name = change.asset?.name
      const tokenAddress = change.asset?.nftContract?.address
      const collectionName = change.asset?.collection?.name
      const imageURL = change.asset?.imageUrl
      const tokenId = change.asset?.tokenId
      if (!(recipient && tokenAddress && collectionName && imageURL && name && tokenId))
        return undefined
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
    if (change.tokenStandard) {
      const tokenAddress = change.asset?.address
      const recipient = change.recipient
      const currencyAmountRaw = parseUnits(
        change.quantity,
        BigNumber.from(
          change.tokenStandard === 'NATIVE' ? nativeCurrency.decimals : change.asset.decimals
        )
      ).toString()
      if (!(recipient && tokenAddress)) return undefined
      return {
        type: TransactionType.Send,
        assetType: AssetType.Currency,
        tokenAddress,
        recipient,
        currencyAmountRaw,
      }
    }
  }

  return undefined
}
