import React, { createContext, PropsWithChildren, useContext, useState } from 'react'
import { BiometricAuthenticationStatus } from 'src/features/biometrics'

export interface BiometricContextValue {
  authenticationStatus: Maybe<BiometricAuthenticationStatus>
  setAuthenticationStatus: (value: Maybe<BiometricAuthenticationStatus>) => void
}

const biomericContextValue: BiometricContextValue = {
  authenticationStatus: undefined,
  setAuthenticationStatus: () => undefined,
}

const BiometricContext = createContext<BiometricContextValue>(biomericContextValue)

export const BiometricContextProvider = ({ children }: PropsWithChildren<unknown>): JSX.Element => {
  // global authenticationStatus
  const [status, setStatus] = useState<Maybe<BiometricAuthenticationStatus>>()
  const setAuthenticationStatus = (value: Maybe<BiometricAuthenticationStatus>): void => {
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
