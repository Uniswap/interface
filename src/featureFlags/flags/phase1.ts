import { BaseVariant, useBaseFlag } from '../index'

export function usePhase1Flag(): BaseVariant {
  return useBaseFlag('phase1')
}

export { BaseVariant as Phase1Variant }
