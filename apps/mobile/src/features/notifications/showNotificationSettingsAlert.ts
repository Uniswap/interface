import { Alert } from 'react-native'
import { openNotificationSettings } from 'src/utils/linking'
import i18n from 'uniswap/src/i18n'

export const showNotificationSettingsAlert = (): void => {
  Alert.alert(
    i18n.t('onboarding.notification.permission.title'),
    i18n.t('onboarding.notification.permission.message'),
    [
      { text: i18n.t('common.navigation.settings'), onPress: openNotificationSettings },
      {
        text: i18n.t('common.button.cancel'),
      },
    ],
  )
}
