import DeviceInfo from 'react-native-device-info'
import { isBetaEnv, isDevEnv } from 'utilities/src/environment/env'

/**
 * Returns a string with the app version and build number in the format:
 *
 * DEV: AppSemVer.BuildNumber: e.g. 1.2.3.233
 * PROD: AppSemVer: eg. 1
 */
export function getFullAppVersion({ includeBuildNumber = false }: { includeBuildNumber?: boolean } = {}): string {
  const version = DeviceInfo.getVersion()
  const buildVersion = DeviceInfo.getBuildNumber()

  if (includeBuildNumber || __DEV__) {
    return `${version} (${buildVersion})`
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
