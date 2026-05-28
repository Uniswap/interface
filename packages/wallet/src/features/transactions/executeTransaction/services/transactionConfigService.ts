import type { UniverseChainId } from 'uniswap/src/features/chains/types'

/**
 * Service for transaction-related configuration
 * Centralizes access to configuration values
 */
export interface TransactionConfigService {
  /**
   * Check if private RPC feature is enabled
   * @returns True if private RPC is enabled
   */
  isPrivateRpcEnabled(): boolean

  /**
   * Get configuration for private RPC
   * @returns Configuration object for private RPC
   */
  getPrivateRpcConfig(): {
    flashbotsEnabled: boolean
  }

  /**
   * Get transaction timeout in milliseconds for a chain
   * @param chainId The blockchain chain ID
   * @returns Timeout in milliseconds
   */
  getTransactionTimeoutMs(input: { chainId: UniverseChainId }): number

  /**
   * Determine if private RPC should be used for a chain
   * @param input The input object containing chainId and submitViaPrivateRpc
   * @returns True if private RPC should be used
   */
  shouldUsePrivateRpc(input: { chainId: UniverseChainId; submitViaPrivateRpc?: boolean }): boolean
}
