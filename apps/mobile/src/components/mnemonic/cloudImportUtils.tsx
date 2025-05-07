import { Alert } from 'react-native'
import { isCloudStorageAvailable } from 'src/features/CloudBackup/RNCloudStorageBackupsManager'
import { openSettings } from 'src/utils/linking'
import { AppTFunction } from 'ui/src/i18n/types'
import { isAndroid } from 'utilities/src/platform'

/**
 * Checks whether cloud backup (iCloud/GDrive) is available. Otherwise we
 * show them alert prompting them to enable it.
 *
 * @param t - translation function
 * @returns true if cloud backup is available, false otherwise
 */
export const checkCloudBackupOrShowAlert = async (t: AppTFunction): Promise<boolean> => {
  const cloudStorageAvailable = await isCloudStorageAvailable()

  if (cloudStorageAvailable) {
    return true
  }

  Alert.alert(
    isAndroid ? t('account.cloud.error.unavailable.title.android') : t('account.cloud.error.unavailable.title.ios'),
    isAndroid ? t('account.cloud.error.unavailable.message.android') : t('account.cloud.error.unavailable.message.ios'),
    [
      {
        text: t('account.cloud.error.unavailable.button.settings'),
        onPress: openSettings,
        style: 'default',
      },
      { text: t('account.cloud.error.unavailable.button.cancel'), style: 'cancel' },
    ],
  )
  return false
}
