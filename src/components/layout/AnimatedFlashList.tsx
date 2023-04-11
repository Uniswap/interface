import { FlashList, FlashListProps } from '@shopify/flash-list'
import React, { forwardRef } from 'react'
import { FlatListProps } from 'react-native'
import Animated from 'react-native-reanimated'

// difficult to properly type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ReanimatedFlashList = Animated.createAnimatedComponent(FlashList as any) as any

// difficult to properly type
export const AnimatedFlashList = forwardRef<
  typeof ReanimatedFlashList,
  // We use `any` to make list work with forwardRef, but lose correct typing.
  // Need to extend manually Pick props from FlashListProps (if not included in FlatListProps)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  FlatListProps<any> &
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Pick<FlashListProps<any>, 'estimatedItemSize' | 'estimatedListSize' | 'getItemType'>
>(({ ...restProps }, ref) => {
  return <ReanimatedFlashList ref={ref} {...restProps} />
})
