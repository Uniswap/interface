import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useInfoTDPFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.infoTDP, BaseVariant.Enabled)
}

export function useInfoTDPEnabled(): boolean {
  return useInfoTDPFlag() === BaseVariant.Enabled
}
