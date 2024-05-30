import { isWebAndroid } from 'uniswap/src/utils/platform'

export function getCloudProviderName(): string {
  if (isWebAndroid) {
    return 'Google Drive'
  }
  return 'iCloud'
}
