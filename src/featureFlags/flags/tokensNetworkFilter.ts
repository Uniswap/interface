import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useTokensNetworkFilterFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.tokensNetworkFilter)
}

export { BaseVariant as TokensNetworkFilterVariant }
