import { FeatureFlags, getFeatureFlag, useFeatureFlag } from '@universe/gating'
import { useMemo } from 'react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { filterChainIdsByFeatureFlag } from 'uniswap/src/features/chains/utils'

export const getFeatureFlaggedChainIds = createGetFeatureFlaggedChainIds({
  getLineaStatus: () => getFeatureFlag(FeatureFlags.Linea),
  getMegaETHStatus: () => getFeatureFlag(FeatureFlags.MegaETH),
  getTempoStatus: () => getFeatureFlag(FeatureFlags.Tempo),
  getXLayerStatus: () => getFeatureFlag(FeatureFlags.XLayer),
})

// Used to feature flag chains. If a chain is not included in the object, it is considered enabled by default.
export function useFeatureFlaggedChainIds(): UniverseChainId[] {
  const lineaStatus = useFeatureFlag(FeatureFlags.Linea)
  const megaETHStatus = useFeatureFlag(FeatureFlags.MegaETH)
  const tempoStatus = useFeatureFlag(FeatureFlags.Tempo)
  const xLayerStatus = useFeatureFlag(FeatureFlags.XLayer)

  return useMemo(
    () =>
      createGetFeatureFlaggedChainIds({
        getLineaStatus: () => lineaStatus,
        getMegaETHStatus: () => megaETHStatus,
        getTempoStatus: () => tempoStatus,
        getXLayerStatus: () => xLayerStatus,
      })(),
    [lineaStatus, megaETHStatus, tempoStatus, xLayerStatus],
  )
}

export function createGetFeatureFlaggedChainIds(ctx: {
  getLineaStatus: () => boolean
  getMegaETHStatus: () => boolean
  getTempoStatus: () => boolean
  getXLayerStatus: () => boolean
}): () => UniverseChainId[] {
  return () =>
    filterChainIdsByFeatureFlag({
      [UniverseChainId.Linea]: ctx.getLineaStatus(),
      [UniverseChainId.MegaETH]: ctx.getMegaETHStatus(),
      [UniverseChainId.Tempo]: ctx.getTempoStatus(),
      [UniverseChainId.XLayer]: ctx.getXLayerStatus(),
    })
}
