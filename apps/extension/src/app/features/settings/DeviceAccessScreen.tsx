import { useTranslation } from 'react-i18next'
import { ScreenHeader } from 'src/app/components/layout/ScreenHeader'
import { BiometricUnlockSettingsToggleRow } from 'src/app/features/settings/BiometricUnlock/BiometricUnlockSettingsToggleRow'
import { SettingsItem } from 'src/app/features/settings/components/SettingsItem'
import { AppRoutes, SettingsRoutes } from 'src/app/navigation/constants'
import { useExtensionNavigation } from 'src/app/navigation/utils'
import { Flex, ScrollView } from 'ui/src'
import { Key } from 'ui/src/components/icons/Key'

export function DeviceAccessScreen(): JSX.Element {
  const { t } = useTranslation()
  const { navigateTo } = useExtensionNavigation()

  return (
    <Flex fill backgroundColor="$surface1" gap="$spacing8">
      <ScreenHeader title={t('settings.setting.deviceAccess.title')} />

      <ScrollView showsVerticalScrollIndicator={false}>
        <BiometricUnlockSettingsToggleRow />

        <SettingsItem
          Icon={Key}
          title={t('settings.setting.password.title')}
          onPress={(): void => navigateTo(`${AppRoutes.Settings}/${SettingsRoutes.ChangePassword}`)}
        />
      </ScrollView>
    </Flex>
  )
}
