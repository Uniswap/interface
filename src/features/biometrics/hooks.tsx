import React, { useCallback, useMemo, useState } from 'react'
import { BiometricAuthenticationStatus, tryLocalAuthenticate } from 'src/features/biometrics'
import { BiometricModal } from 'src/features/biometrics/Modal'

/**
 * Wrapper around the biometric prompt.
 * Note. Be careful with using `trigger` and `modal` in large components as it could cause
 *       re-renders. Try to encapsulate this hook in a component if possible.
 * @returns trigger Trigger the OS biometric flow and invokes successCallback on success,
 *  or opens modal on failure
 * @returns modal Custom biometric modal displayed on biometric auth failure
 */
export function useBiometricPrompt(successCallback?: () => void) {
  const [authenticationStatus, setAuthenticationStatus] = useState<BiometricAuthenticationStatus>()

  const trigger = useCallback(async () => {
    const authStatus = await tryLocalAuthenticate()

    setAuthenticationStatus(authStatus)

    if (biometricAuthenticationSuccessful(authStatus)) {
      successCallback?.()
    }
  }, [successCallback])

  const show = !!authenticationStatus && !biometricAuthenticationSuccessful(authenticationStatus)

  const modal = useMemo(
    () => (
      <BiometricModal
        authenticationStatus={authenticationStatus}
        show={show}
        tryAuthenticate={trigger}
      />
    ),
    [authenticationStatus, show, trigger]
  )

  return { trigger, modal }
}

function biometricAuthenticationSuccessful(status: BiometricAuthenticationStatus) {
  return status === BiometricAuthenticationStatus.AUTHENTICATED
}
