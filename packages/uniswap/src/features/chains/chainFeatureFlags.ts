import { UniverseChainId } from '@universe/chains'
import { FeatureFlags } from '@universe/gating'

/**
 * Statsig rollout flags for chains that are supported on all apps but not yet GA.
 * Do not use feature flags to gate chains by app — use `supportedApps` on chain info instead.
 */
export const CHAIN_ROLLOUT_FLAGS = {
  [UniverseChainId.Arc]: FeatureFlags.Arc,
  [UniverseChainId.Ink]: FeatureFlags.Ink,
  [UniverseChainId.Linea]: FeatureFlags.Linea,
  [UniverseChainId.MegaETH]: FeatureFlags.MegaETH,
  [UniverseChainId.Robinhood]: FeatureFlags.Robinhood,
  [UniverseChainId.Tempo]: FeatureFlags.Tempo,
  [UniverseChainId.XLayer]: FeatureFlags.XLayer,
} as const satisfies Partial<Record<UniverseChainId, FeatureFlags>>

export type ChainRolloutFlaggedChainId = keyof typeof CHAIN_ROLLOUT_FLAGS

/**
 * Statsig kill switches for chains being shut down: gate on removes the chain. Inverted from rollout
 * flags so a missing or not-yet-loaded gate keeps the chain, since users still need it to bridge out.
 */
export const CHAIN_SUNSET_FLAGS = {
  [UniverseChainId.Blast]: FeatureFlags.DisableBlast,
} as const satisfies Partial<Record<UniverseChainId, FeatureFlags>>
