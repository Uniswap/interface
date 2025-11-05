import type { ReactNode } from 'react'
import type { ButtonEmphasis, ButtonVariant, FlexProps, TextProps } from 'ui/src'
import type { ModalNameType } from 'uniswap/src/features/telemetry/constants'

export interface DialogProps {
  isOpen: boolean
  onClose: () => void
  icon: ReactNode
  title: string | ReactNode
  titleColor?: TextProps['color']
  subtext: string | ReactNode
  learnMoreUrl?: string
  learnMoreTextColor?: TextProps['color']
  learnMoreTextVariant?: TextProps['variant']
  modalName: ModalNameType
  primaryButtonText?: string
  primaryButtonOnPress?: () => void
  primaryButtonVariant?: ButtonVariant
  primaryButtonEmphasis?: ButtonEmphasis
  isPrimaryButtonLoading?: boolean
  secondaryButtonText?: string
  secondaryButtonOnPress?: () => void
  secondaryButtonVariant?: ButtonVariant
  secondaryButtonEmphasis?: ButtonEmphasis
  buttonContainerProps?: FlexProps
  children?: ReactNode
  footer?: ReactNode
  alignment?: 'top' | 'center'
  textAlign?: 'center' | 'left'
  displayHelpCTA?: boolean
  iconBackgroundColor?: FlexProps['backgroundColor']
}
