import { useFocusEffect } from '@react-navigation/core'
import { useCallback, useRef, useState } from 'react'
import { LayoutChangeEvent } from 'react-native'
import { TypedUseSelectorHook, useSelector } from 'react-redux'
import type { MobileState } from 'src/app/reducer'
import { SagaGenerator, select } from 'typed-redux-saga'
import { spacing } from 'ui/src/theme'

// Use throughout the app instead of plain `useDispatch` and `useSelector`

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
  const showNativeKeyboard = isLayoutPending ? false : containerHeight + MIN_INPUT_DECIMAL_PAD_GAP > decimalPadY

  return {
    onInputPanelLayout,
    onDecimalPadLayout,
    isLayoutPending,
    showNativeKeyboard,
    // can be used to imitate flexGrow=1 for the input panel
    maxContentHeight: isLayoutPending || showNativeKeyboard ? undefined : decimalPadY - MIN_INPUT_DECIMAL_PAD_GAP,
  }
}

const getNativeComponentKey = (): string => `native-component-${Math.random().toString()}`

export function useNativeComponentKey(autoUpdate = true): {
  key: string
  triggerUpdate: () => void
} {
  const isInitialRenderRef = useRef(true)

  const [key, setKey] = useState(getNativeComponentKey)

  useFocusEffect(
    useCallback(() => {
      if (isInitialRenderRef.current || !autoUpdate) {
        isInitialRenderRef.current = false
        return
      }
      setKey(getNativeComponentKey())
    }, [autoUpdate]),
  )

  const triggerUpdate = useCallback(() => {
    setKey(getNativeComponentKey())
  }, [])

  return {
    key,
    triggerUpdate,
  }
}
