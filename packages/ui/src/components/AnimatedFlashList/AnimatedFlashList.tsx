import type { FlashListProps } from '@shopify/flash-list'
import type { FlatListProps } from 'react-native'

/**
 * Platform-specific implementations:
 * - Web: Uses regular FlashList (AnimatedFlashList.web.tsx)
 * - Native: Uses Reanimated animated FlashList (AnimatedFlashList.native.tsx)
 *
 * FlashList 2 dropped `disableAutoLayout`, `estimatedItemSize`, and
 * `estimatedListSize` — they're now auto-handled internally.
 */

// oxlint-disable-next-line typescript/no-explicit-any -- Generic FlashList props require any for flexibility
export type AnimatedFlashListProps = FlatListProps<any> &
  Pick<
    // oxlint-disable-next-line typescript/no-explicit-any -- Generic FlashList props require any for flexibility
    FlashListProps<any>,
    'getItemType' | 'overrideItemLayout' | 'drawDistance'
  >

export const AnimatedFlashList = (() => {
  throw new Error('AnimatedFlashList: Implemented in .native.tsx and .web.tsx')
  // oxlint-disable-next-line typescript/no-explicit-any -- Stub component type
}) as any

export const AnimatedBottomSheetFlashList = (() => {
  throw new Error('AnimatedBottomSheetFlashList: Implemented in .native.tsx and .web.tsx')
  // oxlint-disable-next-line typescript/no-explicit-any -- Stub component type
}) as any
