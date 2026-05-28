import { isAndroid } from '@universe/environment'

export function getCloudProviderName(): string {
  if (isAndroid) {
    return 'Google Drive'
  }
  return 'iCloud'
}
