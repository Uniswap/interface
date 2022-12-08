import { useTheme } from '@shopify/restyle'
import { useEffect, useState } from 'react'
import { AccessibilityInfo } from 'react-native'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import type { RootState } from 'src/app/rootReducer'
import type { AppDispatch } from 'src/app/store'
import type { Theme } from 'src/styles/theme'
import { select } from 'typed-redux-saga'

// Use throughout the app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

// Pre-typed Restyle theme accessor hook
export const useAppTheme = () => useTheme<Theme>()

// Use in sagas for better typing when selecting from redux state
export function* appSelect<T>(fn: (state: RootState) => T) {
  const state = yield* select(fn)
  return state
}

export function useAccessibilityInfo() {
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
