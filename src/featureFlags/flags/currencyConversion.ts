import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

// eslint-disable-next-line import/no-unused-modules
export function useCurrencyConversionFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.currencyConversion)
}
