import { ChainId } from 'src/constants/chains'
import { ActivityType } from 'src/data/__generated__/types-and-hooks'
import parseApproveTransaction from 'src/features/transactions/history/conversion/parseApproveTransaction'
import parseNFTMintTransaction from 'src/features/transactions/history/conversion/parseMintTransaction'
import parseReceiveTransaction from 'src/features/transactions/history/conversion/parseReceiveTransaction'
import parseSendTransaction from 'src/features/transactions/history/conversion/parseSendTransaction'
import parseTradeTransaction from 'src/features/transactions/history/conversion/parseTradeTransaction'
import {
  TransactionDetails,
  TransactionListQueryResponse,
  TransactionStatus,
  TransactionType,
  TransactionTypeInfo,
} from 'src/features/transactions/types'

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

  return {
    id: transaction.transaction.hash,
    // @TODO: [MOB-3901] update with chainId from txn when backend supports other networks
    chainId: ChainId.Mainnet,
    hash: transaction.transaction.hash,
    addedTime: transaction.timestamp * 1000, // convert to ms
    status: TransactionStatus.Success,
    from: transaction.transaction.from,
    typeInfo,
    options: { request: {} }, // Empty request is okay, gate re-submissions on txn type and status.
  }
}
