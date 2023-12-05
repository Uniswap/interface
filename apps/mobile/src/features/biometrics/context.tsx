import { hasHardwareAsync } from 'expo-local-authentication'
import React, { createContext, PropsWithChildren, useContext, useState } from 'react'
import { BiometricAuthenticationStatus } from 'src/features/biometrics'
import { useAsyncData } from 'utilities/src/react/hooks'

export interface BiometricContextValue {
  authenticationStatus: Maybe<BiometricAuthenticationStatus>
  setAuthenticationStatus: (value: Maybe<BiometricAuthenticationStatus>) => void
  deviceSupportsBiometrics: boolean | undefined
}

const biomericContextValue: BiometricContextValue = {
  authenticationStatus: undefined,
  setAuthenticationStatus: () => undefined,
  deviceSupportsBiometrics: undefined,
}

const BiometricContext = createContext<BiometricContextValue>(biomericContextValue)

export function BiometricContextProvider({ children }: PropsWithChildren<unknown>): JSX.Element {
  // global authenticationStatus
  const [status, setStatus] = useState<Maybe<BiometricAuthenticationStatus>>()
  const setAuthenticationStatus = (value: Maybe<BiometricAuthenticationStatus>): void => {
    setStatus(value)
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
