import DeviceInfo from 'react-native-device-info'

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

export function isDevBuild(): boolean {
  return DeviceInfo.getBundleId().endsWith('.dev')
}

export function isBetaBuild(): boolean {
  return DeviceInfo.getBundleId().endsWith('.beta')
}
