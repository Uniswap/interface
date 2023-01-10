import { ThunkDispatch } from '@reduxjs/toolkit'
import { useTheme } from '@shopify/restyle'
import { useEffect, useState } from 'react'
import { AccessibilityInfo } from 'react-native'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import { SelectEffect } from 'redux-saga/effects'
import type { RootState } from 'src/app/rootReducer'
import type { AppDispatch } from 'src/app/store'
import type { Theme } from 'src/styles/theme'
import { SagaGenerator, select } from 'typed-redux-saga'

// Use throughout the app instead of plain `useDispatch` and `useSelector`
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useAppDispatch = (): ThunkDispatch<any, any, any> => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

// Pre-typed Restyle theme accessor hook
export const useAppTheme = (): Theme => useTheme<Theme>()

// Use in sagas for better typing when selecting from redux state
export function* appSelect<T>(fn: (state: RootState) => T): SagaGenerator<T, SelectEffect> {
  const state = yield* select(fn)
  return state
}

interface AccessibilitySettings {
  reduceMotionEnabled: boolean
}

export function useAccessibilityInfo(): AccessibilitySettings {
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState(false)

  useEffect(() => {
    const reduceMotionChangedSubscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (isReduceMotionEnabled) => {
        setReduceMotionEnabled(isReduceMotionEnabled)
      }
    )

    AccessibilityInfo.isReduceMotionEnabled().then((isReduceMotionEnabled) => {
      setReduceMotionEnabled(isReduceMotionEnabled)
    })

    return () => {
      reduceMotionChangedSubscription.remove()
    }
  }, [])

  return { reduceMotionEnabled }
}
