import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useLandingPageFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.landingPage)
}

export { BaseVariant as LandingPageVariant }
