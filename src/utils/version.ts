import DeviceInfo from 'react-native-device-info'

/**
 * Returns a string with the app version and build number in the format:
 *
 * AppSemVer.BuildNumber: e.g. 1.2.3.233
 */
export function getFullAppVersion() {
  const version = DeviceInfo.getVersion()
  const buildVersion = DeviceInfo.getBuildNumber()

  return `${version}.${buildVersion}`
}
