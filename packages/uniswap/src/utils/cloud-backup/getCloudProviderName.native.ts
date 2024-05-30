// eslint-disable-next-line no-restricted-imports
import { Platform } from 'react-native'

export function getCloudProviderName(): string {
  switch (Platform.OS) {
    case 'android':
      return 'Google Drive'
    case 'ios':
      return 'iCloud'
    default:
      return ''
  }
}
