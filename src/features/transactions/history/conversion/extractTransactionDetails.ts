import { ChainId } from 'src/constants/chains'
import parseAppoveTransction from 'src/features/transactions/history/conversion/parseApproveTransaction'
import parseReceiveTransction from 'src/features/transactions/history/conversion/parseReceiveTransaction'
import parseSendTransction from 'src/features/transactions/history/conversion/parseSendTransaction'
import parseTradeTransaction from 'src/features/transactions/history/conversion/parseTradeTransaction'
import { TransactionHistoryResponse } from 'src/features/transactions/history/transactionHistory'
import {
  TransactionDetails,
  TransactionStatus,
  TransactionType,
  TransactionTypeInfo,
} from 'src/features/transactions/types'

/**
 * Parses txn API response item and identifies known txn type. Helps strictly
 * type txn summary dat to be used within UI.
 *
 * @param transaction Transaction api response item to parse.
 * @returns Formatted TransactionDetails object.
 */
export default function extractTransactionDetails(
  transaction: Nullable<TransactionHistoryResponse>
): TransactionDetails | null {
  if (!transaction) return null

  let typeInfo: TransactionTypeInfo | undefined
  switch (transaction.type) {
    case 'APPROVE':
      typeInfo = parseAppoveTransction(transaction)
      break
    case 'SEND':
      typeInfo = parseSendTransction(transaction)
      break
    case 'RECEIVE':
      typeInfo = parseReceiveTransction(transaction)
      break
    case 'SWAP':
      typeInfo = parseTradeTransaction(transaction)
      break
  }

  // No match found, ddefault to unknown.
  if (!typeInfo) {
    typeInfo = {
      type: TransactionType.Unknown,
      tokenAddress: transaction.transaction.to,
    }
  }

  return {
    id: transaction.transaction.hash,
    // @TODO: update with chainId from txn when backened supports other networks
    chainId: ChainId.Mainnet,
    hash: transaction.transaction.hash,
    addedTime: transaction.timestamp,
    status: TransactionStatus.Success,
    from: transaction.transaction.from,
    typeInfo,
    options: { request: {} }, // Empty request is okay, gate re-submissions on txn type and status.
  }
}
