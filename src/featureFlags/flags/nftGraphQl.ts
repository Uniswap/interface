import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useNftGraphQlFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.nftGraphQl)
}

export { BaseVariant as NftGraphQlVariant }
