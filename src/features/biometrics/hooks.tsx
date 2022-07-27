import { AuthenticationType, supportedAuthenticationTypesAsync } from 'expo-local-authentication'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useAppSelector } from 'src/app/hooks'
import { BiometricAuthenticationStatus, tryLocalAuthenticate } from 'src/features/biometrics'
import { BiometricModal } from 'src/features/biometrics/Modal'
import { BiometricSettingsState } from 'src/features/biometrics/slice'

/**
 * Wrapper around the biometric prompt.
 * Note. Be careful with using `trigger` and `modal` in large components as it could cause
 *       re-renders. Try to encapsulate this hook in a component if possible.
 * @returns trigger Trigger the OS biometric flow and invokes successCallback on success,
 *  or opens modal on failure
 * @returns modal Custom biometric modal displayed on biometric auth failure
 */
export function useBiometricPrompt(successCallback?: (params?: any) => void) {
  const [authenticationStatus, setAuthenticationStatus] = useState<BiometricAuthenticationStatus>()

  const trigger = useCallback(
    async (params?: any) => {
      const authStatus = await tryLocalAuthenticate()

      setAuthenticationStatus(authStatus)

      if (biometricAuthenticationSuccessful(authStatus)) {
        successCallback?.(params)
      }
    },
    [successCallback]
  )

  const cancel = () => setAuthenticationStatus(undefined)

  const show = !!authenticationStatus && !biometricAuthenticationSuccessful(authenticationStatus)

  const modal = useMemo(
    () => (
      <BiometricModal
        authenticationStatus={authenticationStatus}
        cancel={cancel}
        show={show}
        tryAuthenticate={trigger}
      />
    ),
    [authenticationStatus, show, trigger]
  )

  return { trigger, modal }
}

export function biometricAuthenticationSuccessful(status: BiometricAuthenticationStatus) {
  return status === BiometricAuthenticationStatus.Authenticated
}

/**
 * Check function of biometric (faceId specific) device support
 * @returns deviceSupportsFaceId Boolean value representing faceId Support availability
 */

export function useDeviceSupportsFaceId() {
  // check if device supports faceId authentication, if not, hide faceId option
  const [deviceSupportsFaceId, setDeviceSupportsFaceId] = useState<boolean | null>(null)
  useEffect(() => {
    // TODO: Move into a saga
    const checkAuthenticationTypes = async () => {
      const res = await supportedAuthenticationTypesAsync()
      setDeviceSupportsFaceId(res?.includes(AuthenticationType.FACIAL_RECOGNITION))
    }
    checkAuthenticationTypes()
  }, [])

  return deviceSupportsFaceId
}

export function useBiometricAppSettings(): BiometricSettingsState {
  const biometricSettings = useAppSelector((state) => state.biometricSettings)
  return biometricSettings
}
