import { useEffect, useState } from 'react'
// biome-ignore lint/style/noRestrictedImports: legacy import will be migrated
import { EmitterSubscription, Keyboard, KeyboardEvent, useWindowDimensions } from 'react-native'
import { KeyboardLayout } from 'uniswap/src/utils/useKeyboardLayout'
import { isAndroid } from 'utilities/src/platform'

export function useKeyboardLayout(): KeyboardLayout {
  const window = useWindowDimensions()

  const [keyboardPosition, setKeyboardPosition] = useState(window.height)
  // biome-ignore lint/correctness/useExhaustiveDependencies: +window.height
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
        }),
      )
    } else {
      keyboardListeners.push(
        Keyboard.addListener('keyboardWillChangeFrame', (e: KeyboardEvent) => {
          setKeyboardPosition(e.endCoordinates.screenY)
        }),
      )
    }

    return () => {
      keyboardListeners.forEach((listener) => listener.remove())
    }
  }, [window.height])

  const keyboardHeight = window.height - keyboardPosition

  return { isVisible: keyboardHeight > 0, containerHeight: window.height - keyboardHeight }
}
