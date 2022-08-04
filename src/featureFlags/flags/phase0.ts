import { BaseVariant, useBaseFlag } from '../index'

export function usePhase0Flag(): BaseVariant {
  return useBaseFlag('phase0')
}

export { BaseVariant as Phase0Variant }
