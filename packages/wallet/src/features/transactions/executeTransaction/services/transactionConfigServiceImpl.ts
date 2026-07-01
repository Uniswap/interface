import { DEFAULT_FLASHBOTS_ENABLED } from '@universe/chains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isPrivateRpcSupportedOnChain } from 'wallet/src/features/providers/utils'
import type { TransactionConfigService } from 'wallet/src/features/transactions/executeTransaction/services/transactionConfigService'

/**
 * Implementation of TransactionConfigService that retrieves configuration
 * from feature flags and dynamic configuration sources.
 */
export function createTransactionConfigService(): TransactionConfigService {
  const ONE_MINUTE_MS = 60 * 1000
  const TEN_MINUTES_MS = 10 * ONE_MINUTE_MS

  // Default timeouts by chain
  const chainTimeouts = new Map<UniverseChainId, number>([[UniverseChainId.Mainnet, TEN_MINUTES_MS]])

  return {
    /**
     * Private RPC is always enabled for supported chains.
     */
    isPrivateRpcEnabled(): boolean {
      return true
    },

    /**
     * Get configuration for private RPC
     */
    getPrivateRpcConfig(): { flashbotsEnabled: boolean } {
      return { flashbotsEnabled: DEFAULT_FLASHBOTS_ENABLED }
    },

    /**
     * Get transaction timeout in milliseconds for a chain
     */
    getTransactionTimeoutMs(input: { chainId: UniverseChainId }): number {
      // Get chain-specific timeout or use default
      return chainTimeouts.get(input.chainId) || ONE_MINUTE_MS
    },

    /**
     * Determine if private RPC should be used for a chain
     */
    shouldUsePrivateRpc({
      chainId,
      submitViaPrivateRpc = false,
    }: {
      chainId: UniverseChainId
      submitViaPrivateRpc?: boolean
    }): boolean {
      const privateRpcSupportedOnChain = isPrivateRpcSupportedOnChain(chainId)
      return submitViaPrivateRpc && privateRpcSupportedOnChain
    },
  }
}
