import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useUnifiedRoutingAPIFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.uraEnabled)
}

// eslint-disable-next-line import/no-unused-modules
export function useUnifiedRoutingAPIEnabled(): boolean {
  return useUnifiedRoutingAPIFlag() === BaseVariant.Enabled
}

export { BaseVariant as UnifiedRouterVariant }
