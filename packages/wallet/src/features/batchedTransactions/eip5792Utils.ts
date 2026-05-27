import { BigNumber } from '@ethersproject/bignumber'
import { SagaGenerator, select } from 'typed-redux-saga'
import { selectTransactions } from 'uniswap/src/features/transactions/selectors'
import { TransactionDetails, TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { isFinalizedTxStatus } from 'uniswap/src/features/transactions/types/utils'
import { selectBatchedTransactionById } from 'wallet/src/features/batchedTransactions/selectors'
import { GetCallsStatusResult } from 'wallet/src/features/dappRequests/types'

// Helper function to map transaction status to EIP-5792 status
export function mapTransactionStatusToEip5792Status(status: TransactionStatus): string {
  switch (status) {
    case TransactionStatus.Success:
      return '0x1'
    default:
      return '0x0'
  }
}

enum TransactionStatusCode {
  // Batch has been received by the wallet but has not completed execution onchain (pending)
  Pending = 100,
  // Batch has been included onchain without reverts, receipts array contains info of all calls (confirmed)
  Success = 200,
  // Batch has not been included onchain and wallet will not retry (offchain failure)
  OffchainFailure = 400,
  // TODO: Batch reverted completely and only changes related to gas charge may have been included onchain (chain rules failure)
  // ChainRulesFailure = 500,
}

function getTransactionStatusCode(status: TransactionStatus): TransactionStatusCode {
  switch (status) {
    case TransactionStatus.Replacing:
    case TransactionStatus.Pending:
    case TransactionStatus.Cancelling:
      return TransactionStatusCode.Pending
    case TransactionStatus.Success:
      return TransactionStatusCode.Success
    // All finalized statuses except success
    default:
      return TransactionStatusCode.OffchainFailure
  }
}

/**
 * Tx was finalized as a failure without a receipt (i.e. tx watcher timeout, bundler drop).
 * Reverted-but-mined txs have a receipt and don't hit this branch.
 */
function isFinalizedOffchainFailure(transaction: TransactionDetails): boolean {
  return (
    !transaction.receipt && isFinalizedTxStatus(transaction.status) && transaction.status !== TransactionStatus.Success
  )
}

/**
 * Helper generator function to get the status of a batch of calls.
 * Fetches batch transaction details and associated transaction receipts from the Redux store.
 * @param batchId The ID of the batch transaction.
 * @param accountAddress The address of the account that initiated the batch.
 * @returns GetCallsStatusResult containing the status details or an error.
 */
export function* getCallsStatusHelper(
  batchId: string,
  accountAddress: string,
): SagaGenerator<{ data?: GetCallsStatusResult; error?: string }> {
  const batchedTransaction = yield* select(selectBatchedTransactionById, batchId)
  if (!batchedTransaction) {
    return { error: 'Batch transaction not found' }
  }

  const { chainId, txHashes, userOpHash } = batchedTransaction

  // Get all transactions for the account
  const allTransactions = yield* select(selectTransactions)
  const transactions = Object.values(allTransactions[accountAddress]?.[chainId] ?? {})

  const foundReceipts: NonNullable<GetCallsStatusResult>['receipts'] = []

  let overallStatus = getTransactionStatusCode(TransactionStatus.Pending)

  if (userOpHash) {
    const transaction = transactions.find((tx) => tx.userOpHash === userOpHash)
    if (transaction) {
      if (transaction.receipt && transaction.hash) {
        overallStatus = getTransactionStatusCode(transaction.status)
        foundReceipts.push({
          transactionHash: transaction.hash,
          status: mapTransactionStatusToEip5792Status(transaction.status),
          blockHash: transaction.receipt.blockHash,
          blockNumber: BigNumber.from(transaction.receipt.blockNumber).toHexString(),
          gasUsed: BigNumber.from(transaction.receipt.gasUsed).toHexString(),
          logs: [],
        })
      } else if (isFinalizedOffchainFailure(transaction)) {
        overallStatus = TransactionStatusCode.OffchainFailure
      }
    }
  } else if (txHashes) {
    for (const hash of txHashes) {
      const transaction: TransactionDetails | undefined = transactions.find((tx) => tx.hash === hash)

      if (!transaction) {
        continue
      }

      if (transaction.receipt) {
        // TODO(SWAP-2543): need to investigate possibibility of non-atomic 5792 transactions,
        // but as of now, we can just use the status of the first and only transaction
        overallStatus = getTransactionStatusCode(transaction.status)

        foundReceipts.push({
          transactionHash: hash,
          status: mapTransactionStatusToEip5792Status(transaction.status),
          blockHash: transaction.receipt.blockHash,
          blockNumber: BigNumber.from(transaction.receipt.blockNumber).toHexString(),
          gasUsed: BigNumber.from(transaction.receipt.gasUsed).toHexString(),
          logs: [], // Logs not supported yet
        })
      } else if (isFinalizedOffchainFailure(transaction)) {
        overallStatus = TransactionStatusCode.OffchainFailure
      }
    }
  }

  const transactionHashes = foundReceipts.map((r) => r.transactionHash)

  return {
    data: {
      id: batchId,
      version: '2.0.0',
      chainId: BigNumber.from(chainId).toHexString(),
      receipts: foundReceipts,
      status: overallStatus,
      capabilities: {
        caip345: {
          caip2: `eip155:${chainId}`,
          transactionHashes,
        },
      },
    },
  }
}
