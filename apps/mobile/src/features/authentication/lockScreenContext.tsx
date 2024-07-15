import { useIsFocused } from '@react-navigation/core'
import React, { createContext, PropsWithChildren, useContext, useState } from 'react'
import { useBiometricAppSettings } from 'src/features/biometrics/hooks'
import { useAppStateTrigger } from 'src/utils/useAppStateTrigger'

export interface LockScreenContextValue {
  isLockScreenVisible: boolean
  animationType: AnimationType
  setIsLockScreenVisible: (value: boolean) => void
  setAnimationType: (value: AnimationType) => void
}

type AnimationType = 'none' | 'slide' | 'fade' | undefined

const lockScreenContextValue: LockScreenContextValue = {
  isLockScreenVisible: true,
  animationType: 'none',
  setIsLockScreenVisible: () => null,
  setAnimationType: () => null,
}

const LockScreenContext = createContext<LockScreenContextValue>(lockScreenContextValue)

export function LockScreenContextProvider({ children }: PropsWithChildren<unknown>): JSX.Element {
  const { requiredForAppAccess } = useBiometricAppSettings()
  const [isVisible, setIsVisible] = useState(requiredForAppAccess)
  const [animation, setAnimation] = useState<AnimationType>('none')

  const setIsLockScreenVisible = (value: boolean): void => {
    setIsVisible(value)
  }

  const setAnimationType = (value: AnimationType): void => {
    setAnimation(value)
  }

  return (
    <LockScreenContext.Provider
      value={{
        isLockScreenVisible: isVisible,
        animationType: animation,
        setIsLockScreenVisible,
        setAnimationType,
      }}>
      {children}
    </LockScreenContext.Provider>
  )
}

export function useLockScreenContext(): LockScreenContextValue {
  return useContext(LockScreenContext)
}

export function useLockScreenOnBlur(isDisabled?: boolean): void {
  // Show splash screen if app switcher is opened
  const { setIsLockScreenVisible } = useLockScreenContext()
  const isFocused = useIsFocused()
  useAppStateTrigger('inactive', 'active', () => {
    if (!isFocused || isDisabled) {
      return
    }
    setIsLockScreenVisible(false)
  })
  useAppStateTrigger('active', 'inactive', () => {
    if (!isFocused || isDisabled) {
      return
    }
    setIsLockScreenVisible(true)
  })
  useAppStateTrigger('background', 'active', () => {
    if (!isFocused || isDisabled) {
      return
    }
    setIsLockScreenVisible(false)
  })
  useAppStateTrigger('active', 'background', () => {
    if (!isFocused || isDisabled) {
      return
    }
    setIsLockScreenVisible(true)
  })
}
