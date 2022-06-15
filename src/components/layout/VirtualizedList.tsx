import React, { PropsWithChildren } from 'react'
import { FlatListProps } from 'react-native'
import Animated, { AnimateProps } from 'react-native-reanimated'

/** Dummy component wrapping `FlatList` to behave like a ScrollView */
export const VirtualizedList = ({
  children,
  ...props
}: PropsWithChildren<Partial<AnimateProps<FlatListProps<any>>>>) => {
  return (
    <Animated.FlatList
      {...props}
      ListHeaderComponent={<>{children}</>}
      data={[]}
      keyExtractor={() => 'key'}
      keyboardShouldPersistTaps="always"
      renderItem={null}
      scrollEventThrottle={16}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
    />
  )
}
