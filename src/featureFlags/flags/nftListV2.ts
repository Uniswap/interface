import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useNftListV2Flag(): BaseVariant {
  return useBaseFlag(FeatureFlag.nftListV2)
}

export { BaseVariant as NftListV2Variant }
