import { BottomSheetModal as BaseModal } from '@gorhom/bottom-sheet'
import { ComponentProps, PropsWithChildren } from 'react'
import { LayoutChangeEvent } from 'react-native'
import Animated from 'react-native-reanimated'
import { DynamicColor } from 'ui/src'
import { ModalNameType } from 'wallet/src/telemetry/constants'

export type BottomSheetModalProps = PropsWithChildren<{
  animatedPosition?: Animated.SharedValue<number>
  hideHandlebar?: boolean
  name: ModalNameType
  // TODO MOB-2526 refactor BottomSheetModal to more platform-agnostic
  // Currently only used for web
  isModalOpen?: boolean
  onClose?: () => void
  snapPoints?: Array<string | number>
  stackBehavior?: ComponentProps<typeof BaseModal>['stackBehavior']
  containerComponent?: ComponentProps<typeof BaseModal>['containerComponent']
  footerComponent?: ComponentProps<typeof BaseModal>['footerComponent']
  fullScreen?: boolean
  backgroundColor?: DynamicColor
  blurredBackground?: boolean
  dismissOnBackPress?: boolean
  isDismissible?: boolean
  overrideInnerContainer?: boolean
  renderBehindTopInset?: boolean
  renderBehindBottomInset?: boolean
  hideKeyboardOnDismiss?: boolean
  hideKeyboardOnSwipeDown?: boolean
  // extend the sheet to its maximum snap point when keyboard is visible
  extendOnKeyboardVisible?: boolean
}>

export type BottomSheetModalRef = {
  handleContentLayout: (event: LayoutChangeEvent) => void
}
