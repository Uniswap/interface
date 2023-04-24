import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import { useLockScreenContext } from 'src/features/authentication/lockScreenContext'
import { BiometricAuthenticationStatus } from 'src/features/biometrics'
import { useBiometricContext } from 'src/features/biometrics/context'
import { useBiometricAppSettings, useBiometricPrompt } from 'src/features/biometrics/hooks'
import { useAppStateTrigger } from 'src/utils/useAppStateTrigger'

// TODO: [MOB-3886] handle scenario where user has biometrics enabled as in-app security but disables it at the OS level
export function useBiometricCheck(): void {
  const { requiredForAppAccess } = useBiometricAppSettings()
  const { setIsLockScreenVisible } = useLockScreenContext()
  const { authenticationStatus } = useBiometricContext()
  const successCallback = (): void => {
    setIsLockScreenVisible(false)
  }

  const { trigger } = useBiometricPrompt(successCallback)

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
    SplashScreen.hideAsync() // In case of a race condition where splash screen is not hidden, we want to hide when FaceID forces an app state change
    if (
      requiredForAppAccess &&
      authenticationStatus !== BiometricAuthenticationStatus.Authenticating &&
      authenticationStatus !== BiometricAuthenticationStatus.Rejected
    ) {
      setIsLockScreenVisible(false)
    }
  })

  useAppStateTrigger('active', 'inactive', () => {
    SplashScreen.hideAsync() // In case of a race condition where splash screen is not hidden, we want to hide when FaceID forces an app state change
    if (
      requiredForAppAccess &&
      authenticationStatus !== BiometricAuthenticationStatus.Authenticating
    ) {
      setIsLockScreenVisible(true)
    }
  })
}
