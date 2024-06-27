import { ThunkDispatch } from '@reduxjs/toolkit'
import { useState } from 'react'
import { LayoutChangeEvent } from 'react-native'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import type { AppDispatch } from 'src/app/store'
import { SagaGenerator, select } from 'typed-redux-saga'
import { spacing } from 'ui/src/theme'
import type { MobileState } from './reducer'

// Use throughout the app instead of plain `useDispatch` and `useSelector`
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useAppDispatch = (): ThunkDispatch<any, any, any> => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<MobileState> = useSelector

// Use in sagas for better typing when selecting from redux state
export function* appSelect<T>(fn: (state: MobileState) => T): SagaGenerator<T> {
  const state = yield* select(fn)
  return state
}

const MIN_INPUT_DECIMAL_PAD_GAP = spacing.spacing8

export function useShouldShowNativeKeyboard(): {
  onInputPanelLayout: (event: LayoutChangeEvent) => void
  onDecimalPadLayout: (event: LayoutChangeEvent) => void
  isLayoutPending: boolean
  showNativeKeyboard: boolean
  maxContentHeight?: number
} {
  const [containerHeight, setContainerHeight] = useState<number>()
  const [decimalPadY, setDecimalPadY] = useState<number>()

  const onInputPanelLayout = (event: LayoutChangeEvent): void => {
    if (containerHeight === undefined) {
      setContainerHeight(event.nativeEvent.layout.height)
    }
  }

  const onDecimalPadLayout = (event: LayoutChangeEvent): void => {
    if (decimalPadY === undefined) {
      setDecimalPadY(event.nativeEvent.layout.y)
    }
  }

  const isLayoutPending = containerHeight === undefined || decimalPadY === undefined

  // If decimal pad renders below the input panel, we need to show the native keyboard
  const showNativeKeyboard = isLayoutPending
    ? false
    : containerHeight + MIN_INPUT_DECIMAL_PAD_GAP > decimalPadY

  return {
    onInputPanelLayout,
    onDecimalPadLayout,
    isLayoutPending,
    showNativeKeyboard,
    // can be used to imitate flexGrow=1 for the input panel
    maxContentHeight:
      isLayoutPending || showNativeKeyboard ? undefined : decimalPadY - MIN_INPUT_DECIMAL_PAD_GAP,
  }
}
