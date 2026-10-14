import { UniverseChainId } from '@universe/chains'
import { FeatureFlags, getFeatureFlag, useFeatureFlag } from '@universe/gating'
import { useMemo } from 'react'
import { CHAIN_ROLLOUT_FLAGS, CHAIN_SUNSET_FLAGS } from 'uniswap/src/features/chains/chainFeatureFlags'
import { filterChainIdsByFeatureFlag } from 'uniswap/src/features/chains/utils'

function buildChainFlagMap(getFlagStatus: (flag: FeatureFlags) => boolean): {
  [key in UniverseChainId]?: boolean
} {
  const result: { [key in UniverseChainId]?: boolean } = {}
  for (const [chainId, flag] of Object.entries(CHAIN_ROLLOUT_FLAGS)) {
    result[Number(chainId) as UniverseChainId] = getFlagStatus(flag)
  }
  for (const [chainId, flag] of Object.entries(CHAIN_SUNSET_FLAGS)) {
    result[Number(chainId) as UniverseChainId] = !getFlagStatus(flag)
  }
  return result
}

export const getFeatureFlaggedChainIds = createGetFeatureFlaggedChainIds((flag) => getFeatureFlag(flag))

// Used to feature flag chains. If a chain is not included in the object, it is considered enabled by default.
export function useFeatureFlaggedChainIds(): UniverseChainId[] {
  const arcStatus = useFeatureFlag(FeatureFlags.Arc)
  const disableBlastStatus = useFeatureFlag(FeatureFlags.DisableBlast)
  const inkStatus = useFeatureFlag(FeatureFlags.Ink)
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
          case FeatureFlags.DisableBlast:
            return disableBlastStatus
          case FeatureFlags.Ink:
            return inkStatus
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
    [arcStatus, disableBlastStatus, inkStatus, lineaStatus, megaETHStatus, robinhoodStatus, tempoStatus, xLayerStatus],
  )
}

export function createGetFeatureFlaggedChainIds(
  getFlagStatus: (flag: FeatureFlags) => boolean,
): () => UniverseChainId[] {
  return () => filterChainIdsByFeatureFlag(buildChainFlagMap(getFlagStatus))
}
