import { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { FlashList, FlashListProps } from '@shopify/flash-list'
import { forwardRef } from 'react'
import type { FlatListProps } from 'react-native'
import Animated from 'react-native-reanimated'

// TODO(WALL-5764): update @gorhom/bottom-sheet to latest version so we can use their BottomSheetFlashList

// difficult to properly type
// biome-ignore lint/suspicious/noExplicitAny: Complex type from external library requires any
const ReanimatedFlashList = Animated.createAnimatedComponent(FlashList as any) as any

// We use `any` to make list work with forwardRef, but lose correct typing.
// Need to extend manually Pick props from FlashListProps (if not included in FlatListProps)
// biome-ignore lint/suspicious/noExplicitAny: Generic FlashList props require any for flexibility
type AnimatedFlashListProps = FlatListProps<any> &
  Pick<
    // biome-ignore lint/suspicious/noExplicitAny: Generic FlashList props require any for flexibility
    FlashListProps<any>,
    | 'disableAutoLayout'
    | 'estimatedItemSize'
    | 'estimatedListSize'
    | 'getItemType'
    | 'overrideItemLayout'
    | 'drawDistance'
  >

// difficult to properly type
export const AnimatedFlashList = forwardRef<typeof ReanimatedFlashList, AnimatedFlashListProps>(
  function _AnimatedFlashList(props, ref) {
    return <ReanimatedFlashList ref={ref} label="ReanimatedFlashList" {...props} />
  },
)

export const AnimatedBottomSheetFlashList = forwardRef<typeof ReanimatedFlashList, AnimatedFlashListProps>(
  function _AnimatedBottomSheetFlashList(props, ref) {
    return (
      <ReanimatedFlashList
        ref={ref}
        {...props}
        renderScrollComponent={BottomSheetScrollView}
        label="AnimatedBottomSheetFlashList"
      />
    )
  },
)
