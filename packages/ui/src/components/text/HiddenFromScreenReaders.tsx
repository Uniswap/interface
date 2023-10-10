import { PropsWithChildren } from 'react'
import { View } from 'react-native'

export function HiddenFromScreenReaders<T>({ children }: PropsWithChildren<T>): JSX.Element {
  // TODO(MOB-1533) Make hidden from screen reader functionality work with web too
  return (
    <View accessibilityElementsHidden={true} importantForAccessibility="no-hide-descendants">
      {children}
    </View>
  )
}
