import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function usePermit2Flag(): BaseVariant {
  return useBaseFlag(FeatureFlag.permit2, BaseVariant.Enabled)
}

export function usePermit2Enabled(): boolean {
  return true
}

export { BaseVariant as Permit2Variant }
