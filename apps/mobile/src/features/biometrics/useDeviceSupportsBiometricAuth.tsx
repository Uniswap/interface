import { useSelector } from 'react-redux'
import { selectOsBiometricAuthSupported } from 'src/features/biometrics/biometricsSlice'

/**
 * Check function of biometric device support
 * @returns object representing biometric auth support by type
 */

export function useDeviceSupportsBiometricAuth(): { touchId: boolean; faceId: boolean } {
  // check if device supports biometric authentication
  return useSelector(selectOsBiometricAuthSupported)
}
