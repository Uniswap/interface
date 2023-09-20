import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useFallbackProviderFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.fallbackProvider)
}

export function useFallbackProvider(): boolean {
  return useFallbackProviderFlag() === BaseVariant.Enabled
}
