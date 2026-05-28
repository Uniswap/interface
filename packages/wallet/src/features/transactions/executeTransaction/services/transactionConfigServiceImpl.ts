import { Experiments, FeatureFlags, PrivateRpcProperties } from '@universe/gating'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { DEFAULT_FLASHBOTS_ENABLED } from 'uniswap/src/features/providers/FlashbotsCommon'
import { logger as loggerUtil } from 'utilities/src/logger/logger'
import { isPrivateRpcSupportedOnChain } from 'wallet/src/features/providers/utils'
import { FeatureFlagService } from 'wallet/src/features/transactions/executeTransaction/services/featureFlagService'
import type { TransactionConfigService } from 'wallet/src/features/transactions/executeTransaction/services/transactionConfigService'

type Logger = typeof loggerUtil

/**
 * Implementation of TransactionConfigService that retrieves configuration
 * from feature flags and dynamic configuration sources.
 */
export function createTransactionConfigService(ctx: {
  featureFlagService: FeatureFlagService
  logger: Logger
}): TransactionConfigService {
  const { featureFlagService, logger } = ctx

  const ONE_MINUTE_MS = 60 * 1000
  const TEN_MINUTES_MS = 10 * ONE_MINUTE_MS

  // Default timeouts by chain
  const chainTimeouts = new Map<UniverseChainId, number>([[UniverseChainId.Mainnet, TEN_MINUTES_MS]])

  return {
    /**
     * Check if private RPC feature is enabled
     */
    isPrivateRpcEnabled(): boolean {
      try {
        return featureFlagService.isFeatureEnabled(FeatureFlags.PrivateRpc)
      } catch (error) {
        logger.warn('TransactionConfigService', 'isPrivateRpcEnabled', 'Error checking feature flag', {
          error: error instanceof Error ? error.message : String(error),
        })
        return false // Default to disabled on error
      }
    },

    /**
     * Get configuration for private RPC
     */
    getPrivateRpcConfig(): { flashbotsEnabled: boolean } {
      const flashbotsEnabled = featureFlagService.getExperimentValue<
        Experiments.PrivateRpc,
        PrivateRpcProperties,
        boolean
      >({
        experiment: Experiments.PrivateRpc,
        property: PrivateRpcProperties.FlashbotsEnabled,
        defaultValue: DEFAULT_FLASHBOTS_ENABLED,
      })

      return { flashbotsEnabled }
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
      const isPrivateRpcEnabled = this.isPrivateRpcEnabled()
      const privateRpcSupportedOnChain = isPrivateRpcSupportedOnChain(chainId)
      return submitViaPrivateRpc && isPrivateRpcEnabled && privateRpcSupportedOnChain
    },
  }
}
