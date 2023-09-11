import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useUniswapXDefaultEnabledFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.uniswapXDefaultEnabled)
}

export function useUniswapXDefaultEnabled(): boolean {
  return useUniswapXDefaultEnabledFlag() === BaseVariant.Enabled
}
