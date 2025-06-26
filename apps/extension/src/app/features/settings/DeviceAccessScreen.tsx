import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ScreenHeader } from 'src/app/components/layout/ScreenHeader'
import { BiometricUnlockSettingsToggleRow } from 'src/app/features/settings/BiometricUnlock/BiometricUnlockSettingsToggleRow'
import { SettingsItem } from 'src/app/features/settings/components/SettingsItem'
import { AppRoutes, SettingsRoutes } from 'src/app/navigation/constants'
import { useExtensionNavigation } from 'src/app/navigation/utils'
import { builtInBiometricCapabilitiesQuery } from 'src/app/utils/device/builtInBiometricCapabilitiesQuery'
import { Flex, ScrollView } from 'ui/src'
import { Key } from 'ui/src/components/icons/Key'

export function DeviceAccessScreen(): JSX.Element {
  const { t } = useTranslation()
  const { navigateTo } = useExtensionNavigation()

  const title = useDeviceAccessScreenTitle()

  return (
    <Flex fill backgroundColor="$surface1" gap="$spacing8">
      <ScreenHeader title={title} />

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

export function useDeviceAccessScreenTitle(): string {
  const { t } = useTranslation()
  const { data: biometricCapabilities } = useQuery(builtInBiometricCapabilitiesQuery({ t }))

  return biometricCapabilities?.os === 'mac'
    ? t('settings.setting.deviceAccess.title.touchId')
    : t('settings.setting.deviceAccess.title.biometrics')
}
