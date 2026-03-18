import { useCallback } from 'react'
import { useBiometricAppSettings } from 'src/features/biometrics/useBiometricAppSettings'
import { useBiometricPrompt } from 'src/features/biometricsSettings/hooks'

/**
 * Helper hook to handle biometric speed bump before executing the given callback.
 *
 * @param onVerified - Callback to execute after biometric verification.
 */
export function useBiometricAppSpeedBump(onVerified: () => void): {
  /**
   * Function to trigger biometric verification if enabled before
   * executing the onVerified callback.
   */
  onBiometricContinue: () => Promise<void>
} {
  const {
    requiredForAppAccess: biometricAuthRequiredForAppAccess,
    requiredForTransactions: biometricAuthRequiredForTransactions,
  } = useBiometricAppSettings()
  const { trigger: biometricTrigger } = useBiometricPrompt(onVerified)

  const onBiometricContinue = useCallback(async (): Promise<void> => {
    if (biometricAuthRequiredForAppAccess || biometricAuthRequiredForTransactions) {
      await biometricTrigger()
    } else {
      onVerified()
    }
  }, [biometricAuthRequiredForAppAccess, biometricAuthRequiredForTransactions, biometricTrigger, onVerified])

  return {
    onBiometricContinue,
  }
}
