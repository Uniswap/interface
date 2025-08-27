import { BottomSheetFlashList, BottomSheetScrollableProps } from '@gorhom/bottom-sheet'
import { FlashList, FlashListProps } from '@shopify/flash-list'
import { Ref, forwardRef } from 'react'
import type { FlatListProps, ListRenderItem } from 'react-native'
import Animated from 'react-native-reanimated'

// TODO(INFRA-942): Both components are not typed correctly, as they're difficult to type.
// for now we use `any` to make props compatible, when we e.g. conditionally
// render AnimatedFlashList and AnimatedBottomSheetFlashList.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ReanimatedFlashList = Animated.createAnimatedComponent(FlashList as any) as any

// moved the type locally, as it's not exported from @gorhom/bottom-sheet
type BottomSheetFlashListProps<T> = Omit<
  Animated.AnimateProps<FlashListProps<T>>,
  'decelerationRate' | 'onScroll' | 'scrollEventThrottle'
> &
  BottomSheetScrollableProps & {
    ref?: Ref<typeof BottomSheetFlashList>
  }

// used for createAnimatedComponent to be able to pass functional component there.
const BottomSheetFlashListWithRef = forwardRef<
  React.ElementRef<typeof BottomSheetFlashList>,
  BottomSheetFlashListProps<unknown>
>(function BottomSheetFlashListWithRef(props, ref) {
  return <BottomSheetFlashList ref={ref} {...props} />
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ReanimatedBottomSheetFlashList = Animated.createAnimatedComponent(BottomSheetFlashListWithRef as any) as any

// We use `any` to make list work with forwardRef, but lose correct typing.
// Need to extend manually Pick props from FlashListProps (if not included in FlatListProps)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnimatedFlashListProps = FlatListProps<any> &
  Pick<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    FlashListProps<any>,
    | 'disableAutoLayout'
    | 'estimatedItemSize'
    | 'estimatedListSize'
    | 'getItemType'
    | 'overrideItemLayout'
    | 'drawDistance'
  >

type BottomSheetAnimatedFlashListProps = AnimatedFlashListProps & {
  // TODO(INFRA-943): resolve discrepancy between ListRenderItem from flash-list and react-native
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderItem: ListRenderItem<any>
}

// difficult to properly type
export const AnimatedFlashList = forwardRef<typeof ReanimatedFlashList, AnimatedFlashListProps>(
  function _AnimatedFlashList(props, ref) {
    return <ReanimatedFlashList ref={ref} label="ReanimatedFlashList" {...props} />
  },
)

export const AnimatedBottomSheetFlashList = forwardRef<
  React.ElementRef<typeof ReanimatedBottomSheetFlashList>,
  BottomSheetAnimatedFlashListProps
>(function _AnimatedBottomSheetFlashList(props, ref) {
  return <ReanimatedBottomSheetFlashList ref={ref} label="AnimatedBottomSheetFlashList" {...props} />
})
