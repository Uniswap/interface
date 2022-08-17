import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useTokensFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.tokens)
}

export { BaseVariant as TokensVariant }
