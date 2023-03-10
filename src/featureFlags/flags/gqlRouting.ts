import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useGqlRoutingFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.gqlRouting, BaseVariant.Enabled)
}

export { BaseVariant as GqlRoutingVariant }
