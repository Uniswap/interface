import { FeatureFlags } from '@universe/gating'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

/**
 * Statsig rollout flags for chains that are supported on all apps but not yet GA.
 * Do not use feature flags to gate chains by app — use `supportedApps` on chain info instead.
 */
export const CHAIN_ROLLOUT_FLAGS = {
  [UniverseChainId.Arc]: FeatureFlags.Arc,
  [UniverseChainId.Linea]: FeatureFlags.Linea,
  [UniverseChainId.MegaETH]: FeatureFlags.MegaETH,
  [UniverseChainId.Robinhood]: FeatureFlags.Robinhood,
  [UniverseChainId.Tempo]: FeatureFlags.Tempo,
  [UniverseChainId.XLayer]: FeatureFlags.XLayer,
} as const satisfies Partial<Record<UniverseChainId, FeatureFlags>>

export type ChainRolloutFlaggedChainId = keyof typeof CHAIN_ROLLOUT_FLAGS
