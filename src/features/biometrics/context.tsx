import React, { createContext, PropsWithChildren, useContext, useState } from 'react'
import { BiometricAuthenticationStatus } from 'src/features/biometrics'

export interface BiometricContextValue {
  authenticationStatus: NullUndefined<BiometricAuthenticationStatus>
  setAuthenticationStatus: (value: NullUndefined<BiometricAuthenticationStatus>) => void
}

const biomericContextValue: BiometricContextValue = {
  authenticationStatus: undefined,
  setAuthenticationStatus: () => undefined,
}

const BiometricContext = createContext<BiometricContextValue>(biomericContextValue)

export const BiometricContextProvider = ({ children }: PropsWithChildren<unknown>) => {
  // global authenticationStatus
  const [status, setStatus] = useState<NullUndefined<BiometricAuthenticationStatus>>()
  const setAuthenticationStatus = (value: NullUndefined<BiometricAuthenticationStatus>) => {
    setStatus(value)
  }

  return (
    <BiometricContext.Provider
      value={{
        authenticationStatus: status,
        setAuthenticationStatus,
      }}>
      {children}
    </BiometricContext.Provider>
  )
}

export function useBiometricContext(): BiometricContextValue {
  return useContext(BiometricContext)
}
