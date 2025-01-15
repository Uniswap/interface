import { useMemo } from 'react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { filterChainIdsByFeatureFlag } from 'uniswap/src/features/chains/utils'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

// Used to feature flag chains. If a chain is not included in the object, it is considered enabled by default.
export function useFeatureFlaggedChainIds(): UniverseChainId[] {
  // You can use the useFeatureFlag hook here to enable/disable chains based on feature flags.
  // Example: [ChainId.BLAST]: useFeatureFlag(FeatureFlags.BLAST)
  // IMPORTANT: Don't forget to also update getEnabledChainIdsSaga

  const monadTestnetEnabled = useFeatureFlag(FeatureFlags.MonadTestnet)

  return useMemo(
    () =>
      filterChainIdsByFeatureFlag({
        [UniverseChainId.MonadTestnet]: monadTestnetEnabled,
      }),
    [monadTestnetEnabled],
  )
}
