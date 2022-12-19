import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useLandingRedirectFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.LandingRedirect)
}

export { BaseVariant as LandingRedirectVariant }
