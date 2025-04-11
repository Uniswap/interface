import { isBetaEnv, isDevEnv } from 'utilities/src/environment/env'
import { StatsigEnvironmentTier } from 'wallet/src/version'

// TODO: Add to analytics package and remove
export const EXTENSION_ORIGIN_APPLICATION = 'extension'

export function getStatsigEnvironmentTier(): StatsigEnvironmentTier {
  if (isDevEnv()) {
    return StatsigEnvironmentTier.DEV
  }
  if (isBetaEnv()) {
    return StatsigEnvironmentTier.BETA
  }
  return StatsigEnvironmentTier.PROD
}
