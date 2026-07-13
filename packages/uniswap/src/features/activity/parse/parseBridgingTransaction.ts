import type { OnChainTransaction } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { Direction } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { extractDappInfo } from 'uniswap/src/features/activity/utils/extractDappInfo'
import { ACROSS_DAPP_INFO } from 'uniswap/src/features/transactions/swap/utils/routing'
import type { BridgeTransactionInfo } from 'uniswap/src/features/transactions/types/transactionDetails'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

export function parseBridgeTransaction(transaction: OnChainTransaction): BridgeTransactionInfo | undefined {
  const { transfers } = transaction
  const outTokenTransfer = transfers.find((t) => t.direction === Direction.SEND)
  const inTokenTransfer = transfers.find((t) => t.direction === Direction.RECEIVE)
  const outTokenAsset = outTokenTransfer?.asset.value
  const inTokenAsset = inTokenTransfer?.asset.value
  if (!outTokenAsset || !inTokenAsset) {
    return undefined
  }

  // Use protocol info from API if available, otherwise fall back to ACROSS_DAPP_INFO
  const routingDappInfo = extractDappInfo(transaction) ?? ACROSS_DAPP_INFO
  return {
    type: TransactionType.Bridge,
    inputCurrencyId: buildCurrencyId(outTokenAsset.chainId, outTokenAsset.address),
    outputCurrencyId: buildCurrencyId(inTokenAsset.chainId, inTokenAsset.address),
    inputCurrencyAmountRaw: outTokenTransfer.amount?.raw ?? '',
    outputCurrencyAmountRaw: inTokenTransfer.amount?.raw ?? '',
    transactedUSDValue: undefined,
    routingDappInfo,
  }
}
