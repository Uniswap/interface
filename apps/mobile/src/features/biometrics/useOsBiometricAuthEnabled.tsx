import { useSelector } from 'react-redux'
import { selectOsBiometricAuthEnabled } from 'src/features/biometrics/biometricsSlice'

/**
 * Hook to determine whether biometric auth is enabled in OS settings
 * @returns if Face ID or Touch ID is enabled
 */

export function useOsBiometricAuthEnabled(): boolean | undefined {
  return useSelector(selectOsBiometricAuthEnabled)
}
