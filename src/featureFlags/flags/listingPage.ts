import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useNftListingFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.nftListing)
}

export { BaseVariant as NFTListingVariant }
