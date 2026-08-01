import { DynamicConfigs, FeatureFlags, SwapConfigKey, getDynamicConfigValue, getFeatureFlag } from '@universe/gating'
import { ALL_CHAIN_IDS } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isUniverseChainIdArrayType } from 'uniswap/src/features/gating/typeGuards'

/**
 * Fallback denylist used when the Statsig swap config is unavailable or the key is missing.
 * Chains not listed here support chained actions (Solana and some EVM chains are not yet supported).
 */
export const DEFAULT_CHAINED_ACTIONS_UNSUPPORTED_CHAIN_IDS: UniverseChainId[] = [
  UniverseChainId.Avalanche,
  UniverseChainId.Blast,
  UniverseChainId.Bnb,
  UniverseChainId.Celo,
  UniverseChainId.Polygon,
  UniverseChainId.Solana,
  UniverseChainId.Tempo,
  UniverseChainId.XLayer,
]

/**
 * Returns the chains that do NOT support chained actions, read from the Statsig swap config.
 */
export function getChainedActionsUnsupportedChainIds(): UniverseChainId[] {
  return getDynamicConfigValue({
    config: DynamicConfigs.Swap,
    key: SwapConfigKey.ChainedActionsUnsupportedChainIds,
    defaultValue: DEFAULT_CHAINED_ACTIONS_UNSUPPORTED_CHAIN_IDS,
    customTypeGuard: isUniverseChainIdArrayType,
  })
}

/**
 * Returns the chains that support chained actions (all chains minus the configured denylist).
 */
export function getChainedActionsSupportedChainIds(): UniverseChainId[] {
  const unsupportedChainIds = getChainedActionsUnsupportedChainIds()
  return ALL_CHAIN_IDS.filter((chainId) => !unsupportedChainIds.includes(chainId))
}

/**
 * Checks if a chain is supported for chained actions.
 * Returns false if the ChainedActions feature flag is disabled.
 * @param chainId - The chain ID to check
 * @returns true if the chain supports chained actions and the feature is enabled, false otherwise
 */
export function isChainSupportedForChainedActions(chainId: UniverseChainId): boolean {
  const isChainedActionsEnabled = getFeatureFlag(FeatureFlags.ChainedActions)
  return isChainedActionsEnabled && !getChainedActionsUnsupportedChainIds().includes(chainId)
}
