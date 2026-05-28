import { useQuery } from '@tanstack/react-query'
import { DynamicConfigs, ExtensionBiometricUnlockConfigKey, useDynamicConfigValue } from '@universe/gating'
import { biometricUnlockCredentialQuery } from 'src/app/features/biometricUnlock/biometricUnlockCredentialQuery'

export function useShouldShowBiometricUnlock(): boolean {
  const isEnabled = useDynamicConfigValue({
    config: DynamicConfigs.ExtensionBiometricUnlock,
    key: ExtensionBiometricUnlockConfigKey.EnableUnlocking,
    defaultValue: true,
  })

  const hasBiometricUnlockCredential = useHasBiometricUnlockCredential()

  return isEnabled && hasBiometricUnlockCredential
}

export function useHasBiometricUnlockCredential(): boolean {
  const { data: biometricUnlockCredential } = useQuery(biometricUnlockCredentialQuery())
  return !!biometricUnlockCredential
}
