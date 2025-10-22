// biome-ignore lint/style/noRestrictedImports: Platform-specific implementation needs internal types
import { Keyboard } from 'react-native'

const KEYBOARD_DISMISS_POLLING_INTERVAL = 25
const KEYBOARD_DISMISS_TIMEOUT = 500

export function dismissNativeKeyboard(): void {
  Keyboard.dismiss()
}

export function closeKeyboardBeforeCallback(callback: () => void): void {
  if (Keyboard.isVisible()) {
    dismissNativeKeyboard()
    const dismissRequestTime = Date.now()

    const intervalId = setInterval(() => {
      const timePassed = Date.now() - dismissRequestTime

      // if keyboard is not visible or timeout has passed
      if (!Keyboard.isVisible() || timePassed > KEYBOARD_DISMISS_TIMEOUT) {
        clearInterval(intervalId)
        callback()
      }
    }, KEYBOARD_DISMISS_POLLING_INTERVAL)
  } else {
    callback()
  }
}
