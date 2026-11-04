import type { ReactElement } from 'react'
import type { IconProps } from '../factories/createIcon'
import { CloseIconFrame } from './internal/close-icon-frame'

export type CloseIconProps = {
  onClose: () => void
  size?: IconProps['size']
  color?: string
  hoverColor?: string
  testId?: string
  role?: 'button' | 'none'
}

// Default styling for a basic close icon with hover. Created this component to be use across platforms in order to unify behavior and styling
export function CloseIconWithHover({ size = 24, role = 'button', ...rest }: CloseIconProps): ReactElement {
  return <CloseIconFrame size={size} role={role} {...rest} />
}
