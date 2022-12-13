import { useEffect, useState } from 'react'
import { Keyboard, KeyboardEvent, useWindowDimensions } from 'react-native'

export function useKeyboardLayout(): { isVisible: boolean; containerHeight: number } {
  const window = useWindowDimensions()

  const [keyboardPosition, setKeyboardPosition] = useState(window.height)
  useEffect(() => {
    const keyboardWillChangeFrameListener = Keyboard.addListener(
      'keyboardWillChangeFrame',
      (e: KeyboardEvent) => {
        setKeyboardPosition(e.endCoordinates.screenY)
      }
    )
    return () => {
      keyboardWillChangeFrameListener.remove()
    }
  }, [window.height])

  const keyboardHeight = window.height - keyboardPosition

  return { isVisible: keyboardHeight > 0, containerHeight: window.height - keyboardHeight }
}
