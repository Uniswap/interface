import { useEffect, useState } from 'react'
import { EmitterSubscription, Keyboard, KeyboardEvent, useWindowDimensions } from 'react-native'
import { isAndroid } from 'uniswap/src/utils/platform'

export function useKeyboardLayout(): { isVisible: boolean; containerHeight: number } {
  const window = useWindowDimensions()

  const [keyboardPosition, setKeyboardPosition] = useState(window.height)
  useEffect(() => {
    const keyboardListeners: EmitterSubscription[] = []

    if (isAndroid) {
      // When `android:windowSoftInputMode` is set to `adjustResize` or `adjustNothing`,
      // only `keyboardDidShow` and `keyboardDidHide` events will be available on Android
      keyboardListeners.push(
        Keyboard.addListener('keyboardDidShow', (e: KeyboardEvent) => {
          setKeyboardPosition(e.endCoordinates.screenY)
        }),
        Keyboard.addListener('keyboardDidHide', (e: KeyboardEvent) => {
          setKeyboardPosition(e.endCoordinates.screenY)
        })
      )
    } else {
      keyboardListeners.push(
        Keyboard.addListener('keyboardWillChangeFrame', (e: KeyboardEvent) => {
          setKeyboardPosition(e.endCoordinates.screenY)
        })
      )
    }

    return () => {
      keyboardListeners.forEach((listener) => listener.remove())
    }
  }, [window.height])

  const keyboardHeight = window.height - keyboardPosition

  return { isVisible: keyboardHeight > 0, containerHeight: window.height - keyboardHeight }
}
