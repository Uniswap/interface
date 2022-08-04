import React, { PropsWithChildren } from 'react'
import { View } from 'react-native'

export function HiddenFromScreenReaders<T>({ children }: PropsWithChildren<T>) {
  return (
    <View accessibilityElementsHidden={true} importantForAccessibility="no-hide-descendants">
      {children}
    </View>
  )
}
