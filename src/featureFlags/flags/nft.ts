import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useNftFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.nft)
}

export { BaseVariant as NftVariant }
