import { call, select } from 'typed-redux-saga'
import { filterChainIdsByFeatureFlag, getEnabledChains } from 'uniswap/src/features/chains/utils'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { getFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { selectIsTestnetModeEnabled } from 'uniswap/src/features/settings/selectors'
import { UniverseChainId } from 'uniswap/src/types/chains'

export function* getEnabledChainIdsSaga() {
  const testnetModeFeatureFlag = getFeatureFlag(FeatureFlags.Datadog)
  const testnetModeEnabled = yield* select(selectIsTestnetModeEnabled)

  const worldChainEnabled = getFeatureFlag(FeatureFlags.WorldChain)

  const featureFlaggedChainIds = filterChainIdsByFeatureFlag({
    [UniverseChainId.WorldChain]: worldChainEnabled,
  })

  return yield* call(getEnabledChains, {
    isTestnetModeEnabled: testnetModeEnabled && testnetModeFeatureFlag,
    featureFlaggedChainIds,
  })
}
