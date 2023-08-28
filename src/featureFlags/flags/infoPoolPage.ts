import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useInfoPoolPageFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.infoPoolPage)
}

export function useInfoPoolPageEnabled(): boolean {
  return useInfoPoolPageFlag() === BaseVariant.Enabled
}
