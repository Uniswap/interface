import { Nft, OnChainTransaction, Token } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { extractDappInfo } from 'uniswap/src/features/activity/utils/extractDappInfo'
import { AssetCase, isRestTokenSpam, mapTokenTypeToAssetType } from 'uniswap/src/features/activity/utils/remote'
import { SendTokenTransactionInfo, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'

export function parseSendTransaction(transaction: OnChainTransaction): SendTokenTransactionInfo | undefined {
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
