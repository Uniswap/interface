import { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { FlashList } from '@shopify/flash-list'
import { forwardRef } from 'react'
import Animated from 'react-native-reanimated'
import type { AnimatedFlashListProps } from 'ui/src/components/AnimatedFlashList/AnimatedFlashList'

// difficult to properly type
// oxlint-disable-next-line typescript/no-explicit-any -- Complex type from external library requires any
const ReanimatedFlashList = Animated.createAnimatedComponent(FlashList as any) as any

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
