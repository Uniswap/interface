import { OnChainTransaction } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { TradingApi } from '@universe/api'
import { parseRestApproveTransaction } from 'uniswap/src/features/activity/parse/parseApproveTransaction'
import { parseRestSwapTransaction } from 'uniswap/src/features/activity/parse/parseTradeTransaction'
import {
  TransactionDetails,
  TransactionOriginType,
  TransactionStatus,
  TransactionTypeInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'

/**
 * Represents a parsed EXECUTE transaction that can contain multiple sub-transactions
 */
export interface ParsedExecuteTransaction {
  swapInfo?: TransactionTypeInfo
  approveInfo?: TransactionTypeInfo
}

/**
 * Parse an EXECUTE transaction from the REST API.
 * EXECUTE transactions can contain batched operations like swap + approve.
 * Returns the parsed transaction type info for both operations if present.
 */
export function parseRestExecuteTransaction(transaction: OnChainTransaction): ParsedExecuteTransaction | undefined {
  const hasSwapTransfers = transaction.transfers.length > 0
  const hasApprovals = transaction.approvals.length > 0

  if (!hasSwapTransfers && !hasApprovals) {
    return undefined
  }

  const result: ParsedExecuteTransaction = {}

  // Parse swap if transfers exist
  if (hasSwapTransfers) {
    result.swapInfo = parseRestSwapTransaction(transaction)
  }

  // Parse approve if approvals exist
  if (hasApprovals) {
    result.approveInfo = parseRestApproveTransaction(transaction)
  }

  // Return undefined if both parsing attempts failed
  if (!result.swapInfo && !result.approveInfo) {
    return undefined
  }

  return result
}

/**
 * Helper to build TransactionDetails array from parsed EXECUTE transaction
 */
export function buildExecuteTransactionDetails(params: {
  transaction: OnChainTransaction
  parsed: ParsedExecuteTransaction
  mapStatusFn: (status: number, isCancel: boolean) => TransactionStatus
}): TransactionDetails[] {
  const { transaction, parsed, mapStatusFn } = params
  const { chainId, transactionHash, timestampMillis, from, status, fee } = transaction
  const transactions: TransactionDetails[] = []
  const isCancel = false

  // Create swap transaction if present
  if (parsed.swapInfo) {
    const networkFee = fee
      ? {
          quantity: String(fee.amount?.amount),
          tokenSymbol: fee.symbol,
          tokenAddress: fee.address,
          chainId,
        }
      : undefined

    transactions.push({
      routing: TradingApi.Routing.CLASSIC,
      id: transactionHash,
      hash: transactionHash,
      chainId,
      status: mapStatusFn(status, isCancel),
      addedTime: Number(timestampMillis),
      from,
      typeInfo: parsed.swapInfo,
      options: { request: {} },
      networkFee,
      transactionOriginType: TransactionOriginType.Internal,
    })
  }

  // Create approve transaction if present
  if (parsed.approveInfo) {
    transactions.push({
      routing: TradingApi.Routing.CLASSIC,
      id: `${transactionHash}-approve`,
      hash: transactionHash,
      chainId,
      status: mapStatusFn(status, isCancel),
      addedTime: Number(timestampMillis),
      from,
      typeInfo: parsed.approveInfo,
      options: { request: {} },
      networkFee: undefined, // Fee is only on the main transaction
      transactionOriginType: TransactionOriginType.Internal,
    })
  }

  return transactions
}
