import { call, select } from 'typed-redux-saga'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { filterChainIdsByFeatureFlag, getEnabledChains } from 'uniswap/src/features/chains/utils'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { getFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { selectIsTestnetModeEnabled } from 'uniswap/src/features/settings/selectors'

export function* getEnabledChainIdsSaga() {
  const isTestnetModeEnabled = yield* select(selectIsTestnetModeEnabled)

  const monadTestnetEnabled = getFeatureFlag(FeatureFlags.MonadTestnet)
  const unichainEnabled = getFeatureFlag(FeatureFlags.Unichain)

  const featureFlaggedChainIds = filterChainIdsByFeatureFlag({
    [UniverseChainId.MonadTestnet]: monadTestnetEnabled,
    [UniverseChainId.Unichain]: unichainEnabled,
  })

  return yield* call(getEnabledChains, {
    isTestnetModeEnabled,
    featureFlaggedChainIds,
  })
}
