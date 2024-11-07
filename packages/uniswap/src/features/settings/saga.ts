import { call, select } from 'typed-redux-saga'
import { filterChainIdsByFeatureFlag, getEnabledChains } from 'uniswap/src/features/chains/utils'
import { selectIsTestnetModeEnabled } from 'uniswap/src/features/settings/selectors'

export function* getEnabledChainIdsSaga() {
  const isTestnetModeEnabled = yield* select(selectIsTestnetModeEnabled)

  const featureFlaggedChainIds = filterChainIdsByFeatureFlag({})

  return yield* call(getEnabledChains, {
    isTestnetModeEnabled,
    featureFlaggedChainIds,
  })
}
