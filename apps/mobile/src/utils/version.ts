import DeviceInfo from 'react-native-device-info'
import { isBetaEnv, isDevEnv } from 'uniswap/src/utils/env'
import { StatsigEnvironmentTier } from 'wallet/src/version'

/**
 * Returns a string with the app version and build number in the format:
 *
 * DEV: AppSemVer.BuildNumber: e.g. 1.2.3.233
 * PROD: AppSemVer: eg. 1
 */
export function getFullAppVersion(): string {
  const version = DeviceInfo.getVersion()
  const buildVersion = DeviceInfo.getBuildNumber()

  if (__DEV__) {
    return `${version}.${buildVersion}`
  }
  return version
}

export enum BuildVariant {
  Production = 'prod',
  Beta = 'beta',
  Development = 'dev',
}

export function getBuildVariant(): BuildVariant {
  if (isDevEnv()) {
    return BuildVariant.Development
  } else if (isBetaEnv()) {
    return BuildVariant.Beta
  } else {
    return BuildVariant.Production
  }
}

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

export function getSentryTracesSamplingRate(): number {
  if (isDevEnv() || isBetaEnv()) {
    return 1
  }
  return 0.2
}

enum SentryEnvironment {
  DEV = 'development',
  BETA = 'beta',
  PROD = 'production',
}
