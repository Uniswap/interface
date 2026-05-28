import type { AccountMeta } from 'uniswap/src/features/accounts/types'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { ExecuteTransactionParams } from 'wallet/src/features/transactions/executeTransaction/executeTransactionSaga'
import type { TransactionResponse } from 'wallet/src/features/transactions/executeTransaction/services/TransactionSignerService/transactionSignerService'
import type { CalculatedNonce } from 'wallet/src/features/transactions/executeTransaction/tryGetNonce'

/**
 * Main transaction service interface
 * Provides methods for transaction operations
 */
export interface TransactionService {
  /**
   * Send a transaction to the blockchain
   * @param input Transaction parameters
   * @returns The transaction response
   */
  executeTransaction(input: ExecuteTransactionParams): Promise<{
    transactionResponse: TransactionResponse
  }>

  /**
   * Calculate the next nonce for an account on a chain
   * @param account The account metadata
   * @param chainId The blockchain chain ID
   * @returns The calculated nonce and optionally pending tx count
   */
  getNextNonce(input: {
    account: AccountMeta
    chainId: UniverseChainId
    submitViaPrivateRpc?: boolean
  }): Promise<CalculatedNonce | undefined>
}
