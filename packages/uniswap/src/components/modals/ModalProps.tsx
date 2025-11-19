import type { BottomSheetModal as BaseModal, BottomSheetView } from '@gorhom/bottom-sheet'
import type { ComponentProps, PropsWithChildren, ReactNode } from 'react'
import type { SharedValue } from 'react-native-reanimated'
import type { ColorTokens, SpaceTokens, View } from 'ui/src'
import type { HandleBarProps } from 'uniswap/src/components/modals/HandleBar'
import type { ModalNameType } from 'uniswap/src/features/telemetry/constants'

export type ModalProps = PropsWithChildren<{
  animatedPosition?: SharedValue<number>
  hideHandlebar?: boolean
  forceRoundedCorners?: boolean
  name: ModalNameType
  enableDynamicSizing?: boolean
  onClose?: () => void
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
  focusHook?: ComponentProps<typeof BottomSheetView>['focusHook']
}>
