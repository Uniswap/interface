import { useEffect } from 'react'
import { useLockScreenContext } from 'src/features/authentication/lockScreenContext'
import { useBiometricAppSettings, useBiometricPrompt } from 'src/features/biometrics/hooks'
import { useAppStateTrigger } from 'src/utils/useAppStateTrigger'

// TODO: handle scenario where user has biometrics enabled as in-app security but disables it at the OS level
export function BiometricCheck() {
  const { requiredForAppAccess } = useBiometricAppSettings()
  const { setIsLockScreenVisible } = useLockScreenContext()
  const successCallback = () => {
    setIsLockScreenVisible(false)
  }
  const { trigger, modal } = useBiometricPrompt(successCallback)

  // on mount
  useEffect(() => {
    if (requiredForAppAccess) {
      trigger()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // runs only once so it doesn't run on setting change

  useAppStateTrigger('background', 'active', () => {
    if (requiredForAppAccess) {
      trigger()
    }
  })

  useAppStateTrigger('inactive', 'background', () => {
    if (requiredForAppAccess) {
      setIsLockScreenVisible(true)
    }
  })

  useAppStateTrigger('inactive', 'active', () => {
    if (requiredForAppAccess) {
      setIsLockScreenVisible(false)
    }
  })

  useAppStateTrigger('active', 'inactive', () => {
    if (requiredForAppAccess) {
      setIsLockScreenVisible(true)
    }
  })

  return modal
}
