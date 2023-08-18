import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useCurrencyConversionFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.currencyConversion)
}

export function useCurrencyConversionFlagEnabled(): boolean {
  return useCurrencyConversionFlag() === BaseVariant.Enabled
}
