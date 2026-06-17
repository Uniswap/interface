import { isWebApp } from '@universe/environment'
import { FeatureFlags, getFeatureFlag, useFeatureFlag } from '@universe/gating'
import { useMemo } from 'react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { filterChainIdsByFeatureFlag } from 'uniswap/src/features/chains/utils'

export const getFeatureFlaggedChainIds = createGetFeatureFlaggedChainIds({
  getArcStatus: () => getFeatureFlag(FeatureFlags.Arc),
  getLineaStatus: () => getFeatureFlag(FeatureFlags.Linea),
  getMegaETHStatus: () => getFeatureFlag(FeatureFlags.MegaETH),
  getRobinhoodStatus: () => getFeatureFlag(FeatureFlags.Robinhood),
  getTempoStatus: () => getFeatureFlag(FeatureFlags.Tempo),
  getXLayerStatus: () => getFeatureFlag(FeatureFlags.XLayer),
})

// Used to feature flag chains. If a chain is not included in the object, it is considered enabled by default.
export function useFeatureFlaggedChainIds(): UniverseChainId[] {
  const arcStatus = useFeatureFlag(FeatureFlags.Arc)
  const lineaStatus = useFeatureFlag(FeatureFlags.Linea)
  const megaETHStatus = useFeatureFlag(FeatureFlags.MegaETH)
  const robinhoodStatus = useFeatureFlag(FeatureFlags.Robinhood)
  const tempoStatus = useFeatureFlag(FeatureFlags.Tempo)
  const xLayerStatus = useFeatureFlag(FeatureFlags.XLayer)

  return useMemo(
    () =>
      createGetFeatureFlaggedChainIds({
        getArcStatus: () => arcStatus,
        getLineaStatus: () => lineaStatus,
        getMegaETHStatus: () => megaETHStatus,
        getRobinhoodStatus: () => robinhoodStatus,
        getTempoStatus: () => tempoStatus,
        getXLayerStatus: () => xLayerStatus,
      })(),
    [arcStatus, lineaStatus, megaETHStatus, robinhoodStatus, tempoStatus, xLayerStatus],
  )
}

export function createGetFeatureFlaggedChainIds(ctx: {
  getArcStatus: () => boolean
  getLineaStatus: () => boolean
  getMegaETHStatus: () => boolean
  getRobinhoodStatus: () => boolean
  getTempoStatus: () => boolean
  getXLayerStatus: () => boolean
}): () => UniverseChainId[] {
  return () =>
    filterChainIdsByFeatureFlag({
      [UniverseChainId.Arc]: ctx.getArcStatus(),
      [UniverseChainId.Linea]: ctx.getLineaStatus(),
      [UniverseChainId.MegaETH]: ctx.getMegaETHStatus(),
      [UniverseChainId.Robinhood]: ctx.getRobinhoodStatus(),
      // Solana is only supported on web — mobile and extension do not support SVM wallets
      [UniverseChainId.Solana]: isWebApp,
      [UniverseChainId.Tempo]: ctx.getTempoStatus(),
      [UniverseChainId.XLayer]: ctx.getXLayerStatus(),
    })
}
