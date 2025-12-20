import { FeatureFlags, getFeatureFlag } from '@universe/gating'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

/**
 * Chains that support chained actions.
 * This is an explicit allowlist of EVM chains.
 * Excludes: Solana (SVM) and non-ETH EVM chains (not yet supported).
 */
export const CHAINED_ACTIONS_SUPPORTED_CHAINS: UniverseChainId[] = [
  // Mainnet EVM chains
  UniverseChainId.Mainnet,
  UniverseChainId.ArbitrumOne,
  UniverseChainId.Base,
  UniverseChainId.Optimism,
  UniverseChainId.Soneium,
  UniverseChainId.Unichain,
  UniverseChainId.WorldChain,
  UniverseChainId.Zksync,
  UniverseChainId.Zora,
  // Testnet EVM chains
  UniverseChainId.Sepolia,
  UniverseChainId.UnichainSepolia,
] as const

/**
 * Checks if a chain is supported for chained actions.
 * Returns false if the ChainedActions feature flag is disabled.
 * @param chainId - The chain ID to check
 * @returns true if the chain supports chained actions and the feature is enabled, false otherwise
 */
export function isChainSupportedForChainedActions(chainId: UniverseChainId): boolean {
  const isChainedActionsEnabled = getFeatureFlag(FeatureFlags.ChainedActions)
  return isChainedActionsEnabled && CHAINED_ACTIONS_SUPPORTED_CHAINS.includes(chainId)
}
