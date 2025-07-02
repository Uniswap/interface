import { useMemo } from 'react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { filterChainIdsByFeatureFlag } from 'uniswap/src/features/chains/utils'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { getFeatureFlag, useFeatureFlag } from 'uniswap/src/features/gating/hooks'

export const getFeatureFlaggedChainIds = createGetFeatureFlaggedChainIds({
  getSoneiumStatus: () => getFeatureFlag(FeatureFlags.Soneium),
})

// Used to feature flag chains. If a chain is not included in the object, it is considered enabled by default.
export function useFeatureFlaggedChainIds(): UniverseChainId[] {
  const soneiumStatus = useFeatureFlag(FeatureFlags.Soneium)
  return useMemo(() => createGetFeatureFlaggedChainIds({ getSoneiumStatus: () => soneiumStatus })(), [soneiumStatus])
}

export function createGetFeatureFlaggedChainIds(ctx: { getSoneiumStatus: () => boolean }): () => UniverseChainId[] {
  return () =>
    // You can use the useFeatureFlag hook here to enable/disable chains based on feature flags.
    // Example: [ChainId.BLAST]: useFeatureFlag(FeatureFlags.BLAST)
    filterChainIdsByFeatureFlag({
      [UniverseChainId.Soneium]: ctx.getSoneiumStatus(),
    })
}
