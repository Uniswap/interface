import DeviceInfo from 'react-native-device-info'
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
  if (isDevBuild()) {
    return BuildVariant.Development
  } else if (isBetaBuild()) {
    return BuildVariant.Beta
  } else {
    return BuildVariant.Production
  }
}

export function isDevBuild(): boolean {
  return DeviceInfo.getBundleId().endsWith('.dev')
}

export function isBetaBuild(): boolean {
  return DeviceInfo.getBundleId().endsWith('.beta')
}
export function getStatsigEnvironmentTier(): StatsigEnvironmentTier {
  if (isDevBuild()) {
    return StatsigEnvironmentTier.DEV
  }
  if (isBetaBuild()) {
    return StatsigEnvironmentTier.BETA
  }
  return StatsigEnvironmentTier.PROD
}

export function getSentryEnvironment(): SentryEnvironment {
  if (isDevBuild()) {
    return SentryEnvironment.DEV
  }
  if (isBetaBuild()) {
    return SentryEnvironment.BETA
  }
  return SentryEnvironment.PROD
}

enum SentryEnvironment {
  DEV = 'development',
  BETA = 'beta',
  PROD = 'production',
}
