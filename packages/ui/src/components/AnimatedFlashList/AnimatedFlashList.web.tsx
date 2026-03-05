import { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { FlashList, FlashListProps } from '@shopify/flash-list'
import { forwardRef } from 'react'

/**
 * Web implementation - uses regular FlashList (no Reanimated).
 * On web, the list still works but without the animated scroll physics.
 */

// biome-ignore lint/suspicious/noExplicitAny: Generic FlashList props require any for flexibility
type AnimatedFlashListProps = FlashListProps<any>

export const AnimatedFlashList = forwardRef(function _AnimatedFlashList(
  props: AnimatedFlashListProps,
  ref: React.Ref<FlashList<unknown>>,
) {
  return <FlashList ref={ref} {...props} />
})

export const AnimatedBottomSheetFlashList = forwardRef(function _AnimatedBottomSheetFlashList(
  props: AnimatedFlashListProps,
  ref: React.Ref<FlashList<unknown>>,
) {
  return (
    <FlashList
      ref={ref}
      {...props}
      // biome-ignore lint/suspicious/noExplicitAny: BottomSheetScrollView type compatibility
      renderScrollComponent={BottomSheetScrollView as any}
    />
  )
})
