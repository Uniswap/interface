import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function usePhase0Flag(): BaseVariant {
  return useBaseFlag(FeatureFlag.phase0)
}

export { BaseVariant as Phase0Variant }
