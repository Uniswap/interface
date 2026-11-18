import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import type { IconProps } from '../factories/createIcon'
import { CloseIconFrame } from './internal/close-icon-frame'

export type CloseIconProps = {
  onClose: () => void
  size?: IconProps['size']
  color?: string
  hoverColor?: string
  testId?: string
  role?: 'button' | 'none'
  /** Names the icon-only button; defaults to a translated "Close". Ignored with `role="none"`. */
  'aria-label'?: string
}

// Default styling for a basic close icon with hover. Created this component to be use across platforms in order to unify behavior and styling
export function CloseIconWithHover({
  size = 24,
  role = 'button',
  'aria-label': ariaLabel,
  ...rest
}: CloseIconProps): ReactElement {
  const { t } = useTranslation()
  return (
    <CloseIconFrame
      size={size}
      role={role}
      aria-label={role === 'none' ? undefined : (ariaLabel ?? t('common.button.close'))}
      {...rest}
    />
  )
}
