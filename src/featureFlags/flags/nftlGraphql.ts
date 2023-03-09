import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useNftGraphqlFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.nftGraphql)
}

export function useNftGraphqlEnabled(): boolean {
  return useNftGraphqlFlag() === BaseVariant.Enabled
}

export { BaseVariant as NftGraphqlVariant }
