import { useEffect, useState } from 'react'
// biome-ignore lint/style/noRestrictedImports: legacy import will be migrated
import { EmitterSubscription, Keyboard } from 'react-native'
import { KeyboardInfo } from 'uniswap/src/components/modals/useBottomSheetSafeKeyboard'
import { isIOS } from 'utilities/src/platform'

/**
 *  Hook to substitute KeyboardAvoidingView for a bottom sheet modal
 *  Dynamically add bottom padding equal to keyboard height so that elements have room to shift up
 */
export function useBottomSheetSafeKeyboard(): KeyboardInfo {
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  useEffect(() => {
    let showSubscription: EmitterSubscription
    let hideSubscription: EmitterSubscription

    if (isIOS) {
      // Using keyboardWillShow makes it feel more responsive, but only available on iOS
      showSubscription = Keyboard.addListener('keyboardWillShow', (e) => {
        setKeyboardHeight(e.endCoordinates.height)
      })
      hideSubscription = Keyboard.addListener('keyboardWillHide', () => {
        setKeyboardHeight(0)
      })
    } else {
      // keyboardDidShow only emits after the keyboard has fully appeared
      showSubscription = Keyboard.addListener('keyboardDidShow', (e) => {
        setKeyboardHeight(e.endCoordinates.height)
      })
      hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
        setKeyboardHeight(0)
      })
    }

    return () => {
      showSubscription.remove()
      hideSubscription.remove()
    }
  }, [])

  return { keyboardHeight }
}
