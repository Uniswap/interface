import { BottomSheetModal as BaseModal } from '@gorhom/bottom-sheet'
import { ComponentProps, PropsWithChildren } from 'react'
import { SharedValue } from 'react-native-reanimated'
import { DynamicColor } from 'ui/src'
import { ModalNameType } from 'wallet/src/telemetry/constants'

export type BottomSheetModalProps = PropsWithChildren<{
  animatedPosition?: SharedValue<number>
  hideHandlebar?: boolean
  name: ModalNameType
  enableDynamicSizing?: boolean
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

  // TODO MOB-2526 refactor BottomSheetModal to more platform-agnostic
  // Currently only used for web
  isModalOpen?: boolean
  isCentered?: boolean
  hideScrim?: boolean
}>
