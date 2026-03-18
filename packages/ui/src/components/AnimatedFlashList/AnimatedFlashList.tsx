import type { FlashListProps } from '@shopify/flash-list'
import type { FlatListProps } from 'react-native'

/**
 * Platform-specific implementations:
 * - Web: Uses regular FlashList (AnimatedFlashList.web.tsx)
 * - Native: Uses Reanimated animated FlashList (AnimatedFlashList.native.tsx)
 */

// biome-ignore lint/suspicious/noExplicitAny: Generic FlashList props require any for flexibility
export type AnimatedFlashListProps = FlatListProps<any> &
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

export const AnimatedFlashList = (() => {
  throw new Error('AnimatedFlashList: Implemented in .native.tsx and .web.tsx')
  // biome-ignore lint/suspicious/noExplicitAny: Stub component type
}) as any

export const AnimatedBottomSheetFlashList = (() => {
  throw new Error('AnimatedBottomSheetFlashList: Implemented in .native.tsx and .web.tsx')
  // biome-ignore lint/suspicious/noExplicitAny: Stub component type
}) as any
