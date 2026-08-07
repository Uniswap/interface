import type { KeyboardTypeOptions } from 'react-native'
import { PlatformSplitStubError } from 'utilities/src/errors'

export interface GasFieldTextInputProps {
  accessibilityLabel: string
  autoFocus?: boolean
  keyboardType: KeyboardTypeOptions
  value: string
  onChangeText: (next: string) => void
}

/**
 * Borderless text input for a gas-override field.
 * - Mobile: `BottomSheetTextInput` so the bottom sheet tracks the keyboard.
 * - Web/extension: Tamagui `Input`.
 */
export function GasFieldTextInput(_props: GasFieldTextInputProps): JSX.Element {
  throw new PlatformSplitStubError('GasFieldTextInput')
}
