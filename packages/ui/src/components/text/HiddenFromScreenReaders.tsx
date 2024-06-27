import { PropsWithChildren } from 'react'
import { View, ViewStyle } from 'react-native'

type HiddenFromScreenReadersProps = PropsWithChildren<{
  style?: ViewStyle
}>

export function HiddenFromScreenReaders({
  children,
  style,
}: HiddenFromScreenReadersProps): JSX.Element {
  // TODO(MOB-1533) Make hidden from screen reader functionality work with web too
  return (
    <View
      accessibilityElementsHidden={true}
      importantForAccessibility="no-hide-descendants"
      style={style}>
      {children}
    </View>
  )
}
