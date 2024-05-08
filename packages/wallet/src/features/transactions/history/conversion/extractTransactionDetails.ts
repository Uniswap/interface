import {
  TransactionStatus as RemoteTransactionStatus,
  TransactionType as RemoteTransactionType,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { ChainId } from 'wallet/src/constants/chains'
import { SpamCode } from 'wallet/src/data/types'
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

function remoteTxStatusToLocalTxStatus(
  type: RemoteTransactionType,
  status: RemoteTransactionStatus
): TransactionStatus {
  switch (status) {
    case RemoteTransactionStatus.Failed:
      if (type === RemoteTransactionType.Cancel) {
        return TransactionStatus.FailedCancel
      }
      return TransactionStatus.Failed
    case RemoteTransactionStatus.Pending:
      if (type === RemoteTransactionType.Cancel) {
        return TransactionStatus.Cancelling
      }
      return TransactionStatus.Pending
    case RemoteTransactionStatus.Confirmed:
      if (type === RemoteTransactionType.Cancel) {
        return TransactionStatus.Canceled
      }
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
  if (transaction?.details.__typename !== 'TransactionDetails') {
    return null
  }

  let typeInfo: TransactionTypeInfo | undefined
  switch (transaction.details.type) {
    case RemoteTransactionType.Approve:
      typeInfo = parseApproveTransaction(transaction)
      break
    case RemoteTransactionType.Send:
      typeInfo = parseSendTransaction(transaction)
      break
    case RemoteTransactionType.Receive:
      typeInfo = parseReceiveTransaction(transaction)
      break
    case RemoteTransactionType.Swap:
      typeInfo = parseTradeTransaction(transaction)
      break
    case RemoteTransactionType.Mint:
      typeInfo = parseNFTMintTransaction(transaction)
      break
  }

  // No match found, default to unknown.
  if (!typeInfo) {
    // If a parsing util returns undefined type info, we still want to check if its spam
    const isSpam =
      transaction.details.assetChanges?.some((change) => {
        switch (change?.__typename) {
          case 'NftTransfer':
            return change.asset?.isSpam
          case 'TokenTransfer':
            return change.asset.project?.isSpam || change.asset.project?.spamCode === SpamCode.HIGH
          default:
            return false
        }
      }) ?? true
    typeInfo = {
      type: TransactionType.Unknown,
      tokenAddress: transaction.details.to,
      isSpam,
    }
  }

  const chainId = fromGraphQLChain(transaction.chain)

  return {
    id: transaction.details.hash,
    // fallback to mainnet, although this should never happen
    chainId: chainId ?? ChainId.Mainnet,
    hash: transaction.details.hash,
    addedTime: transaction.timestamp * 1000, // convert to ms
    status: remoteTxStatusToLocalTxStatus(transaction.details.type, transaction.details.status),
    from: transaction.details.from,
    typeInfo,
    options: { request: {} }, // Empty request is okay, gate re-submissions on txn type and status.
  }
}
