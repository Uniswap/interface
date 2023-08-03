import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useUniswapXEthOutputFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.uniswapXEthOutputEnabled)
}

export function useUniswapXEthOutputEnabled(): boolean {
  return useUniswapXEthOutputFlag() === BaseVariant.Enabled
}
