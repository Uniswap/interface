import { isWebAndroid } from 'utilities/src/platform'

export function getCloudProviderName(): string {
  if (isWebAndroid) {
    return 'Google Drive'
  }
  return 'iCloud'
}
