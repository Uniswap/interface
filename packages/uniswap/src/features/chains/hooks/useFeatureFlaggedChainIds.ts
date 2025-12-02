import { FeatureFlags, getFeatureFlag, useFeatureFlag } from '@universe/gating'
import { useMemo } from 'react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { filterChainIdsByFeatureFlag } from 'uniswap/src/features/chains/utils'

export const getFeatureFlaggedChainIds = createGetFeatureFlaggedChainIds({
  getMonadStatus: () => getFeatureFlag(FeatureFlags.Monad),
  getSoneiumStatus: () => getFeatureFlag(FeatureFlags.Soneium),
  getSolanaStatus: () => getFeatureFlag(FeatureFlags.Solana),
})

// Used to feature flag chains. If a chain is not included in the object, it is considered enabled by default.
export function useFeatureFlaggedChainIds(): UniverseChainId[] {
  const monadStatus = useFeatureFlag(FeatureFlags.Monad)
  const soneiumStatus = useFeatureFlag(FeatureFlags.Soneium)
  const solanaStatus = useFeatureFlag(FeatureFlags.Solana)
  return useMemo(
    () =>
      createGetFeatureFlaggedChainIds({
        getMonadStatus: () => monadStatus,
        getSoneiumStatus: () => soneiumStatus,
        getSolanaStatus: () => solanaStatus,
      })(),
    [monadStatus, soneiumStatus, solanaStatus],
  )
}

export function createGetFeatureFlaggedChainIds(ctx: {
  getMonadStatus: () => boolean
  getSoneiumStatus: () => boolean
  getSolanaStatus: () => boolean
}): () => UniverseChainId[] {
  return () =>
    // You can use the useFeatureFlag hook here to enable/disable chains based on feature flags.
    // Example: [ChainId.BLAST]: useFeatureFlag(FeatureFlags.BLAST)
    filterChainIdsByFeatureFlag({
      [UniverseChainId.Monad]: ctx.getMonadStatus(),
      [UniverseChainId.Soneium]: ctx.getSoneiumStatus(),
      [UniverseChainId.Solana]: ctx.getSolanaStatus(),
    })
}
