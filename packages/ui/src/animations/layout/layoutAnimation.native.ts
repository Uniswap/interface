import { LayoutAnimation } from 'react-native'

export function easeInEaseOutLayoutAnimation(): void {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
}
