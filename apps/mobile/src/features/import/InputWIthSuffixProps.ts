import { TextInput as NativeTextInput } from 'react-native'
import { ColorTokens } from 'ui/src'

export interface InputWithSuffixProps {
  alwaysShowInputSuffix?: boolean
  autoCorrect: boolean
  blurOnSubmit: boolean
  inputAlignment: 'center' | 'flex-start'
  value?: string
  inputFontSize: number
  inputMaxFontSizeMultiplier: number
  inputSuffix?: string
  inputSuffixColor?: ColorTokens
  multiline?: boolean
  textAlign?: 'left' | 'right' | 'center'
  lineHeight?: number
  textInputRef: React.RefObject<NativeTextInput | null>
  onBlur?: () => void
  onFocus?: () => void
  onChangeText?: (text: string) => void
  onSubmitEditing?: () => void
}
