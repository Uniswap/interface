import { useMemo } from 'react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { filterChainIdsByFeatureFlag } from 'uniswap/src/features/chains/utils'

// Used to feature flag chains. If a chain is not included in the object, it is considered enabled by default.
export function useFeatureFlaggedChainIds(): UniverseChainId[] {
  // You can use the useFeatureFlag hook here to enable/disable chains based on feature flags.
  // Example: [ChainId.BLAST]: useFeatureFlag(FeatureFlags.BLAST)
  // IMPORTANT: Don't forget to also update getEnabledChainIdsSaga

  return useMemo(() => filterChainIdsByFeatureFlag({}), [])
}
