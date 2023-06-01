import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useRoutingAPIV2Flag(): BaseVariant {
  return useBaseFlag(FeatureFlag.uraEnabled)
}

export function useRoutingAPIV2Enabled(): boolean {
  return useRoutingAPIV2Flag() === BaseVariant.Enabled
}

export { BaseVariant as UnifiedRouterVariant }
