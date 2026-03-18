import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import type {
  OnChainTransactionDetails,
  TransactionDetails,
  TransactionStatus,
} from 'uniswap/src/features/transactions/types/transactionDetails'

/**
 * Repository for transaction state management.
 * Abstracts the storage and retrieval of transaction data.
 */
export interface TransactionRepository {
  /**
   * Add a new transaction to the repository
   * @param transaction The transaction details to add
   */
  addTransaction(input: { transaction: OnChainTransactionDetails }): Promise<void>

  /**
   * Update an existing transaction in the repository
   * @param transaction The updated transaction details
   * @param skipProcessing Optional flag to update without triggering processing of the transaction by the transaction watcher
   */
  updateTransaction(input: { transaction: OnChainTransactionDetails; skipProcessing?: boolean }): Promise<void>

  /**
   * Mark a transaction as finalized with the given status
   * @param transaction The transaction to finalize
   * @param status The final status of the transaction
   */
  finalizeTransaction(input: { transaction: OnChainTransactionDetails; status: TransactionStatus }): Promise<void>

  /**
   * Get the count of pending private transactions for an address on a specific chain
   * @param address The wallet address
   * @param chainId The blockchain chain ID
   * @returns The count of pending private transactions
   */
  getPendingPrivateTransactionCount(input: { address: string; chainId: UniverseChainId }): Promise<number>

  /**
   * Get all transactions for a specific address
   * @param address The wallet address
   * @returns Array of transactions or undefined if none exist
   */
  getTransactionsByAddress(input: { address: string }): Promise<TransactionDetails[] | undefined>
}
