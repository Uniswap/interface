import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useNftGraphqlFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.nftGraphql)
}

export { BaseVariant as NftGraphqlVariant }
