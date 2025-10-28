import { useQuery } from '@tanstack/react-query'
import { DynamicConfigs, ExtensionBiometricUnlockConfigKey, useDynamicConfigValue } from '@universe/gating'
import { useTranslation } from 'react-i18next'
import { builtInBiometricCapabilitiesQuery } from 'src/app/utils/device/builtInBiometricCapabilitiesQuery'

export function useShouldShowBiometricUnlockEnrollment({ flow }: { flow: 'onboarding' | 'settings' }): boolean {
  const { t } = useTranslation()

  const isEnabled = useDynamicConfigValue({
    config: DynamicConfigs.ExtensionBiometricUnlock,
    key:
      flow === 'onboarding'
        ? ExtensionBiometricUnlockConfigKey.EnableOnboardingEnrollment
        : ExtensionBiometricUnlockConfigKey.EnableSettingsEnrollment,
    defaultValue: false,
  })

  const { data: biometricCapabilities } = useQuery(builtInBiometricCapabilitiesQuery({ t }))

  const shouldShowBiometricUnlockEnrollment = isEnabled && Boolean(biometricCapabilities?.hasBuiltInBiometricSensor)
  return shouldShowBiometricUnlockEnrollment
}
