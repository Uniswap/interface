import { ChainId } from '@uniswap/sdk-core'

import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useBaseEnabledFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.baseEnabled)
}

export function useBaseEnabled(): boolean {
  return useBaseEnabledFlag() === BaseVariant.Enabled
}

export function useBaseEnabledChains(): Record<number, boolean> {
  const baseEnabled = useBaseEnabled()
  return {
    [ChainId.BASE]: baseEnabled,
    [ChainId.BASE_GOERLI]: baseEnabled,
  }
}
