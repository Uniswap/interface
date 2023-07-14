import { ChainId } from '@uniswap/sdk-core'

import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useAvalancheFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.avalanche)
}

export function useIsAvalancheEnabled(): boolean {
  return useAvalancheFlag() === BaseVariant.Enabled
}

export function useFilterChainsForAvalanche(chains: ChainId[]): ChainId[] {
  const isAvalancheEnabled = useIsAvalancheEnabled()
  return chains.filter((chain) => chain !== ChainId.AVALANCHE || isAvalancheEnabled)
}
