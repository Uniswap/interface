import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useTaxServiceBannerFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.taxService, BaseVariant.Control)
}

export function useTaxServiceBannerEnabled(): boolean {
  return false
}

export { BaseVariant as TaxServiceVariant }
