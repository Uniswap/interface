import { ChainId } from '@uniswap/sdk-core'
import { useFeatureFlagsContext } from 'featureFlags'

import { DynamicConfigName, useDynamicConfig } from '.'

export function useQuickRouteChains(): ChainId[] {
  const statsigConfig = useDynamicConfig(DynamicConfigName.quickRouteChains)
  const featureFlagsContext = useFeatureFlagsContext()
  let chains = statsigConfig.get(DynamicConfigName.quickRouteChains, []) as ChainId[]

  const modalSetChains =
    featureFlagsContext.configs[DynamicConfigName.quickRouteChains][DynamicConfigName.quickRouteChains]
  if (Array.isArray(modalSetChains) && modalSetChains !== chains) {
    chains = modalSetChains
  }
  if (chains.every((c) => Object.values(ChainId).includes(c))) {
    return chains
  } else {
    console.error('feature flag config chains contain invalid ChainId')
    return []
  }
}
