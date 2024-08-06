import { isBetaEnv, isDevEnv } from 'utilities/src/environment'
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

export function getSentryEnvironment(): SentryEnvironment {
  if (isDevEnv()) {
    return SentryEnvironment.DEV
  }
  if (isBetaEnv()) {
    return SentryEnvironment.BETA
  }
  return SentryEnvironment.PROD
}

enum SentryEnvironment {
  DEV = 'development',
  BETA = 'beta',
  PROD = 'production',
}
