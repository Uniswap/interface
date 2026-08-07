import { useBiometricsIcon } from 'src/components/icons/useBiometricsIcon'
import { useBiometricAppSettings } from 'src/features/biometrics/useBiometricAppSettings'
import { useOsBiometricAuthEnabled } from 'src/features/biometrics/useOsBiometricAuthEnabled'

export function useEarnBiometricsIcon(): JSX.Element | undefined {
  const isBiometricAuthEnabled = useOsBiometricAuthEnabled()
  const { requiredForTransactions } = useBiometricAppSettings()
  const renderBiometricsIcon = useBiometricsIcon()

  if (!isBiometricAuthEnabled || !requiredForTransactions || !renderBiometricsIcon) {
    return undefined
  }

  return renderBiometricsIcon({})
}
