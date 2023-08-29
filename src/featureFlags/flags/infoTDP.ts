import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useInfoTDPFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.infoTDP)
}
