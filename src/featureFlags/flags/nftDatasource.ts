import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useNftDatasourceFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.nftDatasource)
}

export { BaseVariant as NftDatasourceVariant }
