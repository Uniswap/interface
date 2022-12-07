import { FlashList } from '@shopify/flash-list'
import React, { forwardRef } from 'react'
import { FlatListProps } from 'react-native'
import Animated from 'react-native-reanimated'

// difficult to properly type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ReanimatedFlashList = Animated.createAnimatedComponent(FlashList as any) as any

// difficult to properly type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const AnimatedFlashList = forwardRef<typeof ReanimatedFlashList, FlatListProps<any>>(
  ({ ...restProps }, ref) => {
    return <ReanimatedFlashList ref={ref} {...restProps} />
  }
)
