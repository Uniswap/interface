import { isDevelopmentEnv } from 'utils/env'

import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useAboutLandingPageFlag(): BaseVariant {
  const base = useBaseFlag(FeatureFlag.aboutLandingPage)
  return isDevelopmentEnv() ? BaseVariant.Enabled : base
}

export { BaseVariant as LandingPageVariant }
