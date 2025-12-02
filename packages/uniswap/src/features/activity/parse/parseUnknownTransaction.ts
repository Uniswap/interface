import { OnChainTransaction } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { AssetCase, isRestTokenSpam } from 'uniswap/src/features/activity/utils/remote'
import { TransactionType, UnknownTransactionInfo } from 'uniswap/src/features/transactions/types/transactionDetails'

/**
 * Parse an unknown transaction from the REST API
 */
export function parseRestUnknownTransaction(transaction: OnChainTransaction): UnknownTransactionInfo {
  const firstTransfer = transaction.transfers[0]
  let isSpam = false
  let tokenAddress

  if (firstTransfer?.asset.case === AssetCase.Nft) {
    const nft = firstTransfer.asset.value
    isSpam = nft.isSpam
    tokenAddress = nft.address
  }

  if (firstTransfer?.asset.case === AssetCase.Token) {
    const token = firstTransfer.asset.value
    isSpam = isRestTokenSpam(token.metadata?.spamCode)
    tokenAddress = token.address
  }

  return {
    type: TransactionType.Unknown,
    tokenAddress,
    isSpam,
    dappInfo: transaction.protocol?.name
      ? {
          name: transaction.protocol.name,
          icon: transaction.protocol.logoUrl,
        }
      : undefined,
  }
}
