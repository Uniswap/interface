import { OnChainTransaction, OnChainTransactionLabel } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { DappInfoTransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'

/**
 * Extracts Dapp info from a REST API OnChainTransaction's protocol metadata.
 * Falls back to inferring protocol from transaction label when protocol field is empty.
 */
export function extractDappInfo(transaction: OnChainTransaction): DappInfoTransactionDetails | undefined {
  if (transaction.protocol?.name) {
    return {
      name: transaction.protocol.name,
      icon: transaction.protocol.logoUrl,
    }
  }

  // Fallback: infer protocol from transaction label when protocol field is empty
  if (transaction.label === OnChainTransactionLabel.UNISWAP_X) {
    return {
      name: 'Uniswap',
      icon: 'https://protocol-icons.s3.amazonaws.com/icons/uniswap-v4.jpg',
    }
  }

  return undefined
}
