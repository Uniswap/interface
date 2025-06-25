import { useQuery } from '@tanstack/react-query'
import { biometricUnlockCredentialQuery } from 'src/app/features/biometricUnlock/biometricUnlockCredentialQuery'
import { DynamicConfigs, ExtensionBiometricUnlockConfigKey } from 'uniswap/src/features/gating/configs'
import { useDynamicConfigValue } from 'uniswap/src/features/gating/hooks'

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
