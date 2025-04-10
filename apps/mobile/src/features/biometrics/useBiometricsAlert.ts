import { TFunction } from 'i18next/typescript/t'
import { Alert } from 'react-native'
import { openSettings } from 'react-native-permissions'
import { enroll } from 'src/features/biometrics/biometrics-utils'
import { isIOS } from 'utilities/src/platform'

type ShowBiometricsAlert = (biometricsMethod: string) => void

export const useBiometricsAlert = (ctx: { t: TFunction }): { showBiometricsAlert: ShowBiometricsAlert } => {
  const { t } = ctx

  const showBiometricsAlert: ShowBiometricsAlert = (biometricsMethod) => {
    if (isIOS) {
      Alert.alert(
        t('onboarding.security.alert.biometrics.title.ios', { biometricsMethod }),
        t('onboarding.security.alert.biometrics.message.ios', { biometricsMethod }),
        [{ text: t('common.navigation.systemSettings'), onPress: openSettings }, { text: t('common.button.notNow') }],
      )
    } else {
      Alert.alert(
        t('onboarding.security.alert.biometrics.title.android'),
        t('onboarding.security.alert.biometrics.message.android'),
        [{ text: t('onboarding.security.button.setup'), onPress: enroll }, { text: t('common.button.notNow') }],
      )
    }
  }

  return { showBiometricsAlert }
}
