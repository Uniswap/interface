import { View } from 'react-native'
import { HiddenFromScreenReadersProps } from 'ui/src/components/text/HiddenFromScreenReaders'

export function HiddenFromScreenReaders({ children, style }: HiddenFromScreenReadersProps): JSX.Element {
  return (
    <View accessibilityElementsHidden={true} importantForAccessibility="no-hide-descendants" style={style}>
      {children}
    </View>
  )
}
