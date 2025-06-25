import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { builtInBiometricCapabilitiesQuery } from 'src/app/utils/device/builtInBiometricCapabilitiesQuery'
import { DynamicConfigs, ExtensionBiometricUnlockConfigKey } from 'uniswap/src/features/gating/configs'
import { useDynamicConfigValue } from 'uniswap/src/features/gating/hooks'

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
