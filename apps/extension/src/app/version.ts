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

export function getSentryEnvironment(): SentryEnvironment {
  if (isDevEnv()) {
    return SentryEnvironment.DEV
  }
  if (isBetaEnv()) {
    return SentryEnvironment.BETA
  }
  return SentryEnvironment.PROD
}

export function getDatadogEnvironment(): DatadogEnvironment {
  if (isDevEnv()) {
    return DatadogEnvironment.DEV
  }
  if (isBetaEnv()) {
    return DatadogEnvironment.BETA
  }
  return DatadogEnvironment.PROD
}

enum DatadogEnvironment {
  DEV = 'dev',
  BETA = 'beta',
  PROD = 'prod',
}

enum SentryEnvironment {
  DEV = 'development',
  BETA = 'beta',
  PROD = 'production',
}
