import { ChainId } from 'wallet/src/constants/chains'
import {
  ActivityType,
  TransactionStatus as RemoteTransactionStatus,
} from 'wallet/src/data/__generated__/types-and-hooks'
import { fromGraphQLChain } from 'wallet/src/features/chains/utils'
import {
  TransactionDetails,
  TransactionListQueryResponse,
  TransactionStatus,
  TransactionType,
  TransactionTypeInfo,
} from 'wallet/src/features/transactions/types'
import parseApproveTransaction from './parseApproveTransaction'
import parseNFTMintTransaction from './parseMintTransaction'
import parseReceiveTransaction from './parseReceiveTransaction'
import parseSendTransaction from './parseSendTransaction'
import parseTradeTransaction from './parseTradeTransaction'

function remoteTxStatusToLocalTxStatus(status: RemoteTransactionStatus): TransactionStatus {
  switch (status) {
    case RemoteTransactionStatus.Failed:
      return TransactionStatus.Failed
    case RemoteTransactionStatus.Pending:
      return TransactionStatus.Pending
    case RemoteTransactionStatus.Confirmed:
      return TransactionStatus.Success
  }
}

/**
 * Parses txn API response item and identifies known txn type. Helps strictly
 * type txn summary data to be used within UI.
 *
 * @param transaction Transaction api response item to parse.
 * @returns Formatted TransactionDetails object.
 */
export default function extractTransactionDetails(
  transaction: TransactionListQueryResponse
): TransactionDetails | null {
  if (!transaction) return null

  let typeInfo: TransactionTypeInfo | undefined
  switch (transaction.type) {
    case ActivityType.Approve:
      typeInfo = parseApproveTransaction(transaction)
      break
    case ActivityType.Send:
      typeInfo = parseSendTransaction(transaction)
      break
    case ActivityType.Receive:
      typeInfo = parseReceiveTransaction(transaction)
      break
    case ActivityType.Swap:
      typeInfo = parseTradeTransaction(transaction)
      break
    case ActivityType.Mint:
      typeInfo = parseNFTMintTransaction(transaction)
      break
  }

  // No match found, default to unknown.
  if (!typeInfo) {
    typeInfo = {
      type: TransactionType.Unknown,
      tokenAddress: transaction.transaction.to,
    }
  }

  const chainId = fromGraphQLChain(transaction.chain)

  return {
    id: transaction.transaction.hash,
    // fallback to mainnet, although this should never happen
    chainId: chainId ?? ChainId.Mainnet,
    hash: transaction.transaction.hash,
    addedTime: transaction.timestamp * 1000, // convert to ms
    status: remoteTxStatusToLocalTxStatus(transaction.transaction.status),
    from: transaction.transaction.from,
    typeInfo,
    options: { request: {} }, // Empty request is okay, gate re-submissions on txn type and status.
  }
}
