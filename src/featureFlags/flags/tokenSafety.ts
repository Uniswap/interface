import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useTokenSafetyFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.tokenSafety)
}

export { BaseVariant as TokenSafetyVariant }
