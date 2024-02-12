import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useDebounceSwapQuoteFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.debounceSwapQuote)
}

export { BaseVariant as DebounceSwapQuoteVariant }
