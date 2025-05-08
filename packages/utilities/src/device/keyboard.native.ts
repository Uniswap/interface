// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { Keyboard } from 'react-native'

export function dismissNativeKeyboard(): void {
  Keyboard.dismiss()
}
