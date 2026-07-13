import { OnChainTransaction } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { TradingApi } from '@universe/api'
import { parseApproveTransaction } from 'uniswap/src/features/activity/parse/parseApproveTransaction'
import { parseSwapTransaction } from 'uniswap/src/features/activity/parse/parseTradeTransaction'
import { hasTwoTokenTransfersWithMintOrBurn } from 'uniswap/src/features/activity/utils/tokenTransfers'
import { ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import {
  ApproveTransactionInfo,
  ConfirmedSwapTransactionInfo,
  TransactionDetails,
  TransactionOriginType,
  TransactionStatus,
} from 'uniswap/src/features/transactions/types/transactionDetails'

/**
 * Represents a parsed EXECUTE transaction.
 *
 * EXECUTE-labeled on-chain transactions can contain a swap and/or an approval that
 * share a single transaction hash. We surface the swap and fall back to the
 * approval only when there is no swap, since emitting two `TransactionDetails`
 * with the same hash causes `useMergeLocalAndRemoteTransactions` to dedup one
 * of them.
 */
export interface ParsedExecuteTransaction {
  swapInfo?: ConfirmedSwapTransactionInfo
  approveInfo?: ApproveTransactionInfo
}

/**
 * Parse an EXECUTE transaction from the REST API.
 *
 * Prefer displaying the swap for batched swap+approval txs; otherwise, show approval as standalone.
 */
export function parseExecuteTransaction(transaction: OnChainTransaction): ParsedExecuteTransaction | undefined {
  const hasTransfers = transaction.transfers.length > 0
  const hasApprovals = transaction.approvals.length > 0

  if (!hasTransfers && !hasApprovals) {
    return undefined
  }

  // Earn vault actions are emitted with explicit VAULT_* labels by the data-api.
  // For generic EXECUTE rows, avoid treating a two-transfer mint/burn receipt as a swap.
  if (hasTransfers && !hasTwoTokenTransfersWithMintOrBurn(transaction)) {
    const swapInfo = parseSwapTransaction(transaction)
    if (swapInfo) {
      return { swapInfo }
    }
  }

  // Parse approve if approvals exist
  if (hasApprovals) {
    const approveInfo = parseApproveTransaction(transaction)
    if (approveInfo) {
      return { approveInfo }
    }
  }

  return undefined
}

/**
 * Build TransactionDetails array from a parsed EXECUTE transaction.
 *
 * Always returns exactly one entry (primary action first, approval fallback) so the
 * single on-chain hash maps to a single activity row.
 */
export function buildExecuteTransactionDetails(params: {
  transaction: OnChainTransaction
  parsed: ParsedExecuteTransaction
  mapStatusFn: (status: number, isCancel: boolean) => TransactionStatus
}): TransactionDetails[] {
  const { transaction, parsed, mapStatusFn } = params
  const { chainId, transactionHash, timestampMillis, from, status, fee } = transaction
  const isCancel = false

  const networkFee = fee
    ? {
        quantity: String(fee.amount?.amount),
        tokenSymbol: fee.symbol,
        tokenAddress: fee.address,
        chainId,
        valueType: ValueType.Exact,
      }
    : undefined

  const typeInfo = parsed.swapInfo ?? parsed.approveInfo
  if (!typeInfo) {
    return []
  }

  return [
    {
      routing: TradingApi.Routing.CLASSIC,
      id: transactionHash,
      hash: transactionHash,
      chainId,
      status: mapStatusFn(status, isCancel),
      addedTime: Number(timestampMillis),
      from,
      typeInfo,
      options: { request: {} },
      networkFee,
      transactionOriginType: TransactionOriginType.Internal,
    },
  ]
}
