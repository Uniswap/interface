import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useForceUniswapXOnFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.forceUniswapXOn)
}

export function useForceUniswapXOn(): boolean {
  return useForceUniswapXOnFlag() === BaseVariant.Enabled
}
