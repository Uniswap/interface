import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useGqlRoutingFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.gqlRouting)
}

export { BaseVariant as GqlRoutingVariant }
