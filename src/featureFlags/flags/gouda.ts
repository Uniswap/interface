import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useUniswapXFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.uniswapXEnabled)
}

export function useUniswapXEnabled(): boolean {
  return useUniswapXFlag() === BaseVariant.Enabled
}

export { BaseVariant as UniswapXVariant }
