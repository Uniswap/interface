import { isAndroid } from 'utilities/src/platform'

export function getCloudProviderName(): string {
  if (isAndroid) {
    return 'Google Drive'
  }
  return 'iCloud'
}
