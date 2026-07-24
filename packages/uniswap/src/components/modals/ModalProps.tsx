import type { BottomSheetModal as BaseModal, BottomSheetView } from '@gorhom/bottom-sheet'
import type { ComponentProps, PropsWithChildren, ReactNode } from 'react'
import type { SharedValue } from 'react-native-reanimated'
import type { ColorTokens, GetProps, Sheet, SpaceTokens, View } from 'ui/src'
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
  snapPointsMode?: GetProps<typeof Sheet>['snapPointsMode']
  snapPoints?: Array<string | number>
  stackBehavior?: ComponentProps<typeof BaseModal>['stackBehavior']
  containerComponent?: ComponentProps<typeof BaseModal>['containerComponent']
  footerComponent?: ComponentProps<typeof BaseModal>['footerComponent']
  fullScreen?: boolean
  handlebarColor?: HandleBarProps['indicatorColor']
  backgroundColor?: ColorTokens
  blurredBackground?: boolean
  dismissOnBackPress?: boolean
  isDismissible?: boolean
  // defaults to isDismissible; set false to keep handle/backdrop dismissal but stop drags on the sheet content from dismissing (e.g. long scrollable content)
  enableContentPanningGesture?: boolean
  overrideInnerContainer?: boolean
  position?: ComponentProps<typeof View>['position']
  renderBehindTopInset?: boolean
  renderBehindBottomInset?: boolean
  hideKeyboardOnDismiss?: boolean
  hideKeyboardOnSwipeDown?: boolean
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
  maxWidth?: ComponentProps<typeof View>['maxWidth']
  maxHeight?: ComponentProps<typeof View>['maxHeight']
  height?: 'max-content' | 'auto' | '100vh' | '100%' | number | null
  padding?: SpaceTokens
  paddingX?: SpaceTokens
  paddingY?: SpaceTokens
  pt?: SpaceTokens
  pb?: SpaceTokens
  mx?: SpaceTokens
  bottomAttachment?: ReactNode
  gap?: ComponentProps<typeof View>['gap']
  flex?: ComponentProps<typeof View>['flex']
  zIndex?: number
  borderWidth?: number
  borderColor?: ColorTokens
  borderRadius?: ComponentProps<typeof View>['borderRadius']
  overlayOpacity?: number
  focusHook?: ComponentProps<typeof BottomSheetView>['focusHook']
  testID?: string
}>
