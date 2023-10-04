import { ChainId } from '@uniswap/sdk-core'

import { DynamicConfigName, useDynamicConfig } from '.'

// eslint-disable-next-line import/no-unused-modules
export function useQuickRouteChains(): ChainId[] {
  const config = useDynamicConfig(DynamicConfigName.quickRouteChains)
  const chains = config.get('chains', [])
  if (chains.every((c) => Object.values(ChainId).includes(c))) {
    return chains as ChainId[]
  } else {
    console.error('feature flag config chains contain invalid ChainId')
    return []
  }
}
