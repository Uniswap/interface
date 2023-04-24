import { AssetType } from 'src/entities/assets'
import {
  deriveCurrencyAmountFromAssetResponse,
  getAddressFromAsset,
  parseUSDValueFromAssetChange,
} from 'src/features/transactions/history/utils'
import {
  FiatPurchaseTransactionInfo,
  ReceiveTokenTransactionInfo,
  TransactionListQueryResponse,
  TransactionType,
} from 'src/features/transactions/types'
import { areAddressesEqual } from 'src/utils/addresses'
import { fromGraphQLChain } from 'src/utils/chainId'

// Non-exhaustive list of addresses Moonpay uses when sending purchased tokens
const MOONPAY_SENDER_ADDRESSES = [
  '0x8216874887415e2650d12d53ff53516f04a74fd7',
  '0x151b381058f91cf871e7ea1ee83c45326f61e96d',
  '0xb287eac48ab21c5fb1d3723830d60b4c797555b0',
  '0xd108fd0e8c8e71552a167e7a44ff1d345d233ba6',
]

export default function parseReceiveTransaction(
  transaction: TransactionListQueryResponse
): ReceiveTokenTransactionInfo | FiatPurchaseTransactionInfo | undefined {
  const change = transaction?.assetChanges[0]

  if (!change) return undefined

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
      if (!(sender && tokenAddress && collectionName && imageURL && name && tokenId))
        return undefined
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
        },
      }
    }
  }

  // Found ERC20 transfer
  if (change.__typename === 'TokenTransfer') {
    const sender = change.sender
    const isMoonpayPurchase = MOONPAY_SENDER_ADDRESSES.some((address) =>
      areAddressesEqual(address, sender)
    )

    const tokenAddress = getAddressFromAsset({
      chain: change.asset.chain,
      address: change.asset.address,
      tokenStandard: change.tokenStandard,
    })

    const currencyAmountRaw = deriveCurrencyAmountFromAssetResponse(
      change.tokenStandard,
      change.quantity,
      change.asset.decimals
    )
    const transactedUSDValue = parseUSDValueFromAssetChange(change.transactedValue)

    const isSpam = Boolean(change.asset.project?.isSpam) ?? false

    if (!(sender && tokenAddress)) return undefined

    // special case Moonpay transactions as fiat purchases
    if (isMoonpayPurchase) {
      return {
        type: TransactionType.FiatPurchase,
        inputCurrency: { type: 'fiat', code: change.transactedValue?.currency },
        inputCurrencyAmount: Number(change.transactedValue?.value),
        outputCurrency: {
          type: 'crypto',
          metadata: {
            chainId: fromGraphQLChain(change.asset.chain)?.toString(),
            contractAddress: tokenAddress,
          },
        },
        outputCurrencyAmount: Number(change.quantity),
        syncedWithBackend: true,
      } as FiatPurchaseTransactionInfo
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
