import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function usePermit2Flag(): BaseVariant {
  return useBaseFlag(FeatureFlag.permit2)
}

export { BaseVariant as Permit2Variant }
