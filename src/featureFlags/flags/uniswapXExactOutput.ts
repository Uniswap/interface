import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useUniswapXExactOutputFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.uniswapXExactOutputEnabled)
}

export function useUniswapXExactOutputEnabled(): boolean {
  return useUniswapXExactOutputFlag() === BaseVariant.Enabled
}
