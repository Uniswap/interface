import { useCallback } from 'react'
import { useLockScreenContext } from 'src/features/authentication/lockScreenContext'
import { BiometricAuthenticationStatus } from 'src/features/biometrics'
import { useBiometricContext } from 'src/features/biometrics/context'
import { useBiometricAppSettings, useBiometricPrompt } from 'src/features/biometrics/hooks'
import { hideSplashScreen } from 'src/utils/splashScreen'
import { useAppStateTrigger } from 'src/utils/useAppStateTrigger'
import { useAsyncData } from 'utilities/src/react/hooks'

// TODO: [MOB-221] handle scenario where user has biometrics enabled as in-app security but disables it at the OS level
export function useBiometricCheck(): void {
  const { requiredForAppAccess } = useBiometricAppSettings()
  const { setIsLockScreenVisible } = useLockScreenContext()
  const { authenticationStatus } = useBiometricContext()
  const successCallback = (): void => {
    setIsLockScreenVisible(false)
  }

  const { trigger } = useBiometricPrompt(successCallback)

  const triggerBiometricCheck = useCallback(async () => {
    if (requiredForAppAccess) {
      await trigger()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // runs only on mount so it doesn't run on setting change

  useAsyncData(triggerBiometricCheck)

  useAppStateTrigger('background', 'active', async () => {
    if (requiredForAppAccess) {
      await trigger()
    }
  })

  useAppStateTrigger('inactive', 'background', () => {
    if (requiredForAppAccess) {
      setIsLockScreenVisible(true)
    }
  })

  useAppStateTrigger('active', 'background', () => {
    if (requiredForAppAccess) {
      setIsLockScreenVisible(true)
    }
  })

  useAppStateTrigger('inactive', 'active', async () => {
    hideSplashScreen() // In case of a race condition where splash screen is not hidden, we want to hide when FaceID forces an app state change
    // Requires negative check because we don't want to authenticate when switching between active and inactive state
    // It is just required for the case when authentication was requested but user went to app switcher and back to the app
    // to avoid authentication
    if (
      requiredForAppAccess &&
      authenticationStatus !== BiometricAuthenticationStatus.Authenticating &&
      authenticationStatus !== BiometricAuthenticationStatus.SystemCancel &&
      authenticationStatus !== BiometricAuthenticationStatus.UserCancel &&
      authenticationStatus !== BiometricAuthenticationStatus.Rejected &&
      authenticationStatus !== BiometricAuthenticationStatus.Lockout
    ) {
      setIsLockScreenVisible(false)
    }
  })

  useAppStateTrigger('active', 'inactive', () => {
    hideSplashScreen() // In case of a race condition where splash screen is not hidden, we want to hide when FaceID forces an app state change
    if (
      requiredForAppAccess &&
      authenticationStatus !== BiometricAuthenticationStatus.Authenticating
    ) {
      setIsLockScreenVisible(true)
    }
  })
}
