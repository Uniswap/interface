import { FeatureFlags, getFeatureFlag, useFeatureFlag } from '@universe/gating'
import { useMemo } from 'react'
import { CHAIN_ROLLOUT_FLAGS } from 'uniswap/src/features/chains/chainFeatureFlags'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { filterChainIdsByFeatureFlag } from 'uniswap/src/features/chains/utils'

function buildChainRolloutFlagMap(getFlagStatus: (flag: FeatureFlags) => boolean): {
  [key in UniverseChainId]?: boolean
} {
  const result: { [key in UniverseChainId]?: boolean } = {}
  for (const [chainId, flag] of Object.entries(CHAIN_ROLLOUT_FLAGS)) {
    result[Number(chainId) as UniverseChainId] = getFlagStatus(flag)
  }
  return result
}

export const getFeatureFlaggedChainIds = createGetFeatureFlaggedChainIds((flag) => getFeatureFlag(flag))

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
      createGetFeatureFlaggedChainIds((flag) => {
        switch (flag) {
          case FeatureFlags.Arc:
            return arcStatus
          case FeatureFlags.Linea:
            return lineaStatus
          case FeatureFlags.MegaETH:
            return megaETHStatus
          case FeatureFlags.Robinhood:
            return robinhoodStatus
          case FeatureFlags.Tempo:
            return tempoStatus
          case FeatureFlags.XLayer:
            return xLayerStatus
          default:
            return false
        }
      })(),
    [arcStatus, lineaStatus, megaETHStatus, robinhoodStatus, tempoStatus, xLayerStatus],
  )
}

export function createGetFeatureFlaggedChainIds(
  getFlagStatus: (flag: FeatureFlags) => boolean,
): () => UniverseChainId[] {
  return () => filterChainIdsByFeatureFlag(buildChainRolloutFlagMap(getFlagStatus))
}
