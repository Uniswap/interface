import { EffectCallback, useEffect } from 'react'
import { Keyboard } from 'react-native'

// Emprirically determined value
const SET_FOCUS_TIMEOUT_MS = 10

/**
 * Hook to manage active scroll handler when BottomSheet Views or Lists are used inside a BottomSheetModal.
 * Also addresses cases when the keyboard is shown or hidden.
 *
 * It should be passed to `focusHook` prop.
 *
 * @param cb - The callback function which sets the scroll handler to the component, to which this hook was passed.
 */
export function useBottomSheetFocusHook(cb: EffectCallback): () => void {
  useEffect(() => {
    const keyboardWillHideListener = Keyboard.addListener('keyboardWillHide', cb)
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', cb)
    return (): void => {
      keyboardWillHideListener.remove()
      keyboardDidShowListener.remove()
    }
  }, [cb])

  const setFocusTimeout = setTimeout(cb, SET_FOCUS_TIMEOUT_MS)
  return () => clearTimeout(setFocusTimeout)
}
