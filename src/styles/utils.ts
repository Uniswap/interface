import {
  PressableStateCallbackType,
  StyleProp,
  StyleSheet,
  TextStyle,
  ViewStyle,
} from 'react-native'

export function flattenStyleProp(
  style:
    | StyleProp<TextStyle>
    | ((state: PressableStateCallbackType) => StyleProp<ViewStyle>)
    | undefined
) {
  if (!style || typeof style === 'function') return null
  return StyleSheet.flatten(style)
}
