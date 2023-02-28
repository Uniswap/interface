import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useNftGraphqlFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.nftGraphql)
}

// TODO Enable when flag is ready to be used
// export function useNftGraphqlEnabled(): boolean {
//   return useNftGraphqlFlag() === BaseVariant.Enabled
// }

export { BaseVariant as NftGraphqlVariant }
