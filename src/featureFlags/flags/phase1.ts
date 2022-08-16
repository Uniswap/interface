import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function usePhase1Flag(): BaseVariant {
  return useBaseFlag(FeatureFlag.phase1)
}

export { BaseVariant as Phase1Variant }
