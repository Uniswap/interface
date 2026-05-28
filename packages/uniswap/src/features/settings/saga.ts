import { call, select } from 'typed-redux-saga'
import { getFeatureFlaggedChainIds } from 'uniswap/src/features/chains/hooks/useFeatureFlaggedChainIds'
import { getEnabledChains } from 'uniswap/src/features/chains/utils'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
// oxlint-disable-next-line no-restricted-imports -- legacy import will be migrated
import { selectIsTestnetModeEnabled } from 'uniswap/src/features/settings/selectors'

// oxlint-disable-next-line typescript/explicit-function-return-type
export function* getEnabledChainIdsSaga(platform?: Platform) {
  const isTestnetModeEnabled = yield* select(selectIsTestnetModeEnabled)

  const featureFlaggedChainIds = yield* call(getFeatureFlaggedChainIds)

  return yield* call(getEnabledChains, {
    platform,
    isTestnetModeEnabled,
    featureFlaggedChainIds,
  })
}
