import { FlashList } from '@shopify/flash-list'
import React, { forwardRef } from 'react'
import { FlatListProps } from 'react-native'
import Animated from 'react-native-reanimated'

const ReanimatedFlashList = Animated.createAnimatedComponent(FlashList as any) as any

export const AnimatedFlashList = forwardRef<typeof ReanimatedFlashList, FlatListProps<any>>(
  ({ ...restProps }, ref) => {
    return <ReanimatedFlashList ref={ref} {...restProps} />
  }
)
