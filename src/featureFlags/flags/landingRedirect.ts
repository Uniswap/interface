import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useLandingRedirectFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.landingRedirect)
}

export { BaseVariant as LandingRedirectVariant }
