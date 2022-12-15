import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useLandingPageFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.traceJsonRpc, /* defaultValue=*/ BaseVariant.Enabled)
}

export { BaseVariant as LandingPageVariant }
