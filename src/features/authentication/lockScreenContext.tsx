import React, { createContext, PropsWithChildren, useContext, useState } from 'react'

export interface LockScreenContextValue {
  isLockScreenVisible: boolean
  setIsLockScreenVisible: (value: boolean) => void
}

const lockScreenContextValue: LockScreenContextValue = {
  isLockScreenVisible: false,
  setIsLockScreenVisible: () => null,
}

const LockScreenContext = createContext<LockScreenContextValue>(lockScreenContextValue)

export const LockScreenContextProvider = ({ children }: PropsWithChildren<any>) => {
  const [isVisible, setIsVisible] = useState(lockScreenContextValue.isLockScreenVisible)

  const setIsLockScreenVisible = (value: boolean) => {
    setIsVisible(value)
  }

  return (
    <LockScreenContext.Provider value={{ isLockScreenVisible: isVisible, setIsLockScreenVisible }}>
      {children}
    </LockScreenContext.Provider>
  )
}

export function useLockScreenContext(): LockScreenContextValue {
  return useContext(LockScreenContext)
}
