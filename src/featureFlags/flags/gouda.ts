import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useUniswapXFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.uniswapXEnabled)
}

// eslint-disable-next-line import/no-unused-modules
export function useUniswapXEnabled(): boolean {
  return useUniswapXFlag() === BaseVariant.Enabled
}

export { BaseVariant as UniswapXVariant }
