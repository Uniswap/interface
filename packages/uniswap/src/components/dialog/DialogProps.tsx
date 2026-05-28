import type { ReactNode } from 'react'
import type { FlexProps, TextProps } from 'ui/src'
import type { ButtonConfig } from 'uniswap/src/components/dialog/DialogButtons'
import type { DialogPreferencesService } from 'uniswap/src/dialog-preferences'
import type { DialogVisibilityId } from 'uniswap/src/dialog-preferences/types'
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
  primaryButton?: ButtonConfig
  secondaryButton?: ButtonConfig
  isPrimaryButtonLoading?: boolean
  buttonContainerProps?: FlexProps
  children?: ReactNode
  footer?: ReactNode
  alignment?: 'top' | 'center'
  textAlign?: 'center' | 'left'
  displayHelpCTA?: boolean
  getHelpUrl?: string
  iconBackgroundColor?: FlexProps['backgroundColor']
  /**
   * Unique identifier for the dialog. Used to store the dialog's visibility preference.
   * If included, there will be a checkbox that will affect a setting stored on the user's device.
   * When set, dialogs with the same visibilityId will not be shown again.
   */
  visibilityId?: DialogVisibilityId
  /**
   * Service for managing dialog visibility preferences (dependency injection).
   * Required when visibilityId is provided.
   */
  dialogPreferencesService?: DialogPreferencesService
  /**
   * If true, skips rendering the Modal wrapper and only renders the dialog content.
   * Useful when you need to render multiple dialog contents with AnimateTransition within a single Modal.
   */
  skipModalWrapper?: boolean
}
