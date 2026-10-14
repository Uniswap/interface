import type { BottomSheetModal as BaseModal, BottomSheetView } from '@gorhom/bottom-sheet'
import { type ColorTokens, type SheetSnapPointsMode, type SpaceTokens, type View } from '@universe/mycelium'
import type { ComponentProps, PropsWithChildren, ReactNode } from 'react'
import type { SharedValue } from 'react-native-reanimated'
import type { SheetFitHeight } from 'ui/src/components/modal/AdaptiveWebModalShared'
import type { HandleBarProps } from 'uniswap/src/components/modals/HandleBar'
import type { ModalNameType } from 'uniswap/src/features/telemetry/constants'

export type BaseModalProps = {
  isOpen: boolean
  onClose: () => void
}

export type ModalProps = PropsWithChildren<{
  animatedPosition?: SharedValue<number>
  hideHandlebar?: boolean
  forceRoundedCorners?: boolean
  name: ModalNameType
  enableDynamicSizing?: boolean
  onClose?: () => void
  snapPointsMode?: SheetSnapPointsMode
  snapPoints?: Array<string | number>
  // Web only.
  sheetFitHeight?: SheetFitHeight
  stackBehavior?: ComponentProps<typeof BaseModal>['stackBehavior']
  containerComponent?: ComponentProps<typeof BaseModal>['containerComponent']
  footerComponent?: ComponentProps<typeof BaseModal>['footerComponent']
  fullScreen?: boolean
  handlebarColor?: HandleBarProps['indicatorColor']
  backgroundColor?: ColorTokens
  blurredBackground?: boolean
  dismissOnBackPress?: boolean
  isDismissible?: boolean
  // native default: on for multi-detent sheets, and in `Modal` also for fullScreen sheets left with no
  // handle or backdrop; pass explicitly to override
  enableContentPanningGesture?: boolean
  overrideInnerContainer?: boolean
  position?: 'absolute' | 'relative' | 'static' | 'unset'
  renderBehindTopInset?: boolean
  renderBehindBottomInset?: boolean
  hideKeyboardOnDismiss?: boolean
  hideKeyboardOnSwipeDown?: boolean
  // native only; 'restore' settles the sheet back to its resting position after the keyboard hides (gorhom default: 'none')
  keyboardBlurBehavior?: ComponentProps<typeof BaseModal>['keyboardBlurBehavior']
  // native only; controls how the sheet responds when the keyboard appears (gorhom default: 'interactive')
  keyboardBehavior?: ComponentProps<typeof BaseModal>['keyboardBehavior']
  // native only; blur the focused BottomSheetTextInput as soon as a sheet pan starts. Required when the sheet hosts a
  // BottomSheetTextInput: with the keyboard registered as shown, gorhom's pan-end worklet calls Dimensions.get (a
  // non-worklet host function) on the UI runtime and hard-crashes; blurring at pan start keeps that branch unreachable.
  enableBlurKeyboardOnGesture?: boolean
  // extend the sheet to its maximum snap point when keyboard is visible
  extendOnKeyboardVisible?: boolean
  // defaults to `true`
  isModalOpen?: boolean
  analyticsProperties?: Record<string, unknown>
  skipLogImpression?: boolean
  // web-only: skips Tamagui's built-in scroll lock for callers that already manage their own
  disableRemoveScroll?: boolean

  // TODO MOB-2526 refactor Modal to more platform-agnostic
  alignment?: 'center' | 'top'
  hideScrim?: boolean
  maxWidth?: number
  maxHeight?: number | '100%' | `${number}vh`
  height?: 'max-content' | 'auto' | '100vh' | '100%' | number | null
  padding?: SpaceTokens | number
  paddingX?: SpaceTokens | number
  paddingY?: SpaceTokens | number
  pt?: SpaceTokens | number
  pb?: SpaceTokens | number
  mx?: SpaceTokens
  bottomAttachment?: ReactNode
  gap?: SpaceTokens | number
  flex?: ComponentProps<typeof View>['flex']
  zIndex?: number
  borderWidth?: number
  borderColor?: ColorTokens
  borderRadius?: ComponentProps<typeof View>['borderRadius']
  overlayOpacity?: number
  focusHook?: ComponentProps<typeof BottomSheetView>['focusHook']
  testID?: string
}>
