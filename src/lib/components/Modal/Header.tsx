import { StyledButton, styledIcon } from 'lib/styled/components'
import { ReactNode } from 'react'
import { X } from 'react-feather'

import BaseHeader from '../Header'

const StyledXIcon = styledIcon(X, 'text')

export interface HeaderProps {
  title: ReactNode
  onClose: () => void
  children?: ReactNode
}

export default function Header({ title, onClose, children }: HeaderProps) {
  return (
    <BaseHeader title={title} divider>
      {children}
      {onClose && (
        <StyledButton onClick={onClose}>
          <StyledXIcon />
        </StyledButton>
      )}
    </BaseHeader>
  )
}
