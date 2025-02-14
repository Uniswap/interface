import { BottomSheetModal as BaseModal } from '@gorhom/bottom-sheet'
import { ComponentProps, PropsWithChildren, ReactNode } from 'react'
import { SharedValue } from 'react-native-reanimated'
import { ColorTokens, SpaceTokens, View } from 'ui/src'
import { HandleBarProps } from 'uniswap/src/components/modals/HandleBar'
import { ModalNameType } from 'uniswap/src/features/telemetry/constants'

export type ModalProps = PropsWithChildren<{
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
  handlebarColor?: HandleBarProps['indicatorColor']
  backgroundColor?: ColorTokens
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
  // defaults to `true`
  isModalOpen?: boolean
  analyticsProperties?: Record<string, unknown>
  skipLogImpression?: boolean

  // TODO MOB-2526 refactor Modal to more platform-agnostic
  alignment?: 'center' | 'top'
  hideScrim?: boolean
  maxWidth?: number
  maxHeight?: ComponentProps<typeof View>['maxHeight']
  height?: 'max-content' | 'auto' | '100vh' | '100%' | number | null
  padding?: SpaceTokens
  paddingX?: SpaceTokens
  paddingY?: SpaceTokens
  bottomAttachment?: ReactNode
  gap?: ComponentProps<typeof View>['gap']
  flex?: ComponentProps<typeof View>['flex']
  zIndex?: number
}>
