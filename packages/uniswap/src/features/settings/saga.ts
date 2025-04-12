import { call, select } from 'typed-redux-saga'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { filterChainIdsByFeatureFlag, getEnabledChains } from 'uniswap/src/features/chains/utils'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { getFeatureFlag } from 'uniswap/src/features/gating/hooks'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { selectIsTestnetModeEnabled } from 'uniswap/src/features/settings/selectors'

export function* getEnabledChainIdsSaga() {
  const isTestnetModeEnabled = yield* select(selectIsTestnetModeEnabled)

  const monadTestnetEnabled = false //getFeatureFlag(FeatureFlags.MonadTestnet)
  const unichainEnabled = false //getFeatureFlag(FeatureFlags.Unichain)

  const featureFlaggedChainIds = filterChainIdsByFeatureFlag({
    [UniverseChainId.MonadTestnet]: monadTestnetEnabled,
    [UniverseChainId.Soneium]: soneiumEnabled,
    [UniverseChainId.Unichain]: unichainEnabled,
    [UniverseChainId.WorldChain]: false,
    [UniverseChainId.Avalanche]: false,
    [UniverseChainId.Blast]: false,
    [UniverseChainId.Celo]: false,
    [UniverseChainId.Zora]: false,
    [UniverseChainId.Zksync]: false
  })

  return yield* call(getEnabledChains, {
    isTestnetModeEnabled,
    featureFlaggedChainIds,
  })
}
