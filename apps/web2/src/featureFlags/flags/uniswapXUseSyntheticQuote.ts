import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useUniswapXSyntheticQuoteFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.uniswapXSyntheticQuote)
}

export function useUniswapXSyntheticQuoteEnabled(): boolean {
  return useUniswapXSyntheticQuoteFlag() === BaseVariant.Enabled
}
