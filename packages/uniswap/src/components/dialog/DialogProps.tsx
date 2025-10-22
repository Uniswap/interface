import type { ReactNode } from 'react'
import type { ButtonEmphasis, ButtonVariant, FlexProps, TextProps } from 'ui/src'
import type { ModalNameType } from 'uniswap/src/features/telemetry/constants'

export interface DialogProps {
  isOpen: boolean
  onClose: () => void
  icon: ReactNode
  title: string | ReactNode
  subtext: string | ReactNode
  learnMoreUrl?: string
  learnMoreTextColor?: TextProps['color']
  learnMoreTextVariant?: TextProps['variant']
  modalName: ModalNameType
  primaryButtonText: string
  primaryButtonOnClick: () => void
  primaryButtonVariant?: ButtonVariant
  primaryButtonEmphasis?: ButtonEmphasis
  isPrimaryButtonLoading?: boolean
  secondaryButtonText?: string
  secondaryButtonOnClick?: () => void
  secondaryButtonVariant?: ButtonVariant
  secondaryButtonEmphasis?: ButtonEmphasis
  buttonContainerProps?: FlexProps
  children?: ReactNode
  alignment?: 'top' | 'center'
  textAlign?: 'center' | 'left'
  displayHelpCTA?: boolean
  hasIconBackground?: boolean
}
