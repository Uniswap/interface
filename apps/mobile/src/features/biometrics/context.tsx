import { hasHardwareAsync } from 'expo-local-authentication'
import React, { createContext, PropsWithChildren, useContext, useState } from 'react'
import { BiometricAuthenticationStatus } from 'src/features/biometrics'
import { useAsyncData } from 'utilities/src/react/hooks'
import { debounceCallback } from 'utilities/src/time/timing'

export interface BiometricContextValue {
  authenticationStatus: BiometricAuthenticationStatus
  setAuthenticationStatus: (value: BiometricAuthenticationStatus) => void
  deviceSupportsBiometrics: boolean | undefined
}

const biometricContextValue: BiometricContextValue = {
  authenticationStatus: BiometricAuthenticationStatus.Invalid,
  setAuthenticationStatus: () => undefined,
  deviceSupportsBiometrics: undefined,
}

const BiometricContext = createContext<BiometricContextValue>(biometricContextValue)

export function BiometricContextProvider({ children }: PropsWithChildren<unknown>): JSX.Element {
  // global authenticationStatus
  const [status, setStatus] = useState<BiometricAuthenticationStatus>(
    BiometricAuthenticationStatus.Invalid
  )
  const { triggerDebounce, cancelDebounce } = debounceCallback(
    () => setStatus(BiometricAuthenticationStatus.Invalid),
    10000
  )
  const setAuthenticationStatus = (value: BiometricAuthenticationStatus): void => {
    setStatus(value)
    if (value === BiometricAuthenticationStatus.Authenticated) {
      triggerDebounce()
    } else {
      cancelDebounce()
    }
  }
  const { data: deviceSupportsBiometrics } = useAsyncData(hasHardwareAsync)

  return (
    <BiometricContext.Provider
      value={{
        authenticationStatus: status,
        setAuthenticationStatus,
        deviceSupportsBiometrics,
      }}>
      {children}
    </BiometricContext.Provider>
  )
}

export function useBiometricContext(): BiometricContextValue {
  return useContext(BiometricContext)
}
