import { call, select } from 'typed-redux-saga'
import { filterChainIdsByFeatureFlag, getEnabledChains } from 'uniswap/src/features/chains/utils'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { getFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { selectIsTestnetModeEnabled } from 'uniswap/src/features/settings/selectors'

export function* getEnabledChainIdsSaga() {
  const testnetModeFeatureFlag = getFeatureFlag(FeatureFlags.TestnetMode)
  const testnetModeEnabled = yield* select(selectIsTestnetModeEnabled)

  const featureFlaggedChainIds = filterChainIdsByFeatureFlag({})

  return yield* call(getEnabledChains, {
    isTestnetModeEnabled: testnetModeEnabled && testnetModeFeatureFlag,
    featureFlaggedChainIds,
  })
}
