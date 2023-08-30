import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useMultichainUXFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.multichainUX)
}
