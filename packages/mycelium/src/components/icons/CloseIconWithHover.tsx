import { useState } from 'react'
import type { KeyboardEvent, ReactElement } from 'react'
import { Flex } from '../flex'
import { X } from './X'

export type CloseIconProps = {
  onClose: () => void
  size?: number | string
  color?: string
  hoverColor?: string
  testId?: string
  role?: 'button' | 'none'
}

// Default styling for a basic close icon with hover. Created this component to be use across platforms in order to unify behavior and styling
// `--neutral2-hovered` ships with the missing-token-families import (INFRA-2951); until it lands the hover color falls back to `--neutral2`.
export function CloseIconWithHover({
  onClose,
  size = 24,
  color = 'var(--neutral2)',
  hoverColor = 'var(--neutral2-hovered, var(--neutral2))',
  testId,
  role = 'button',
}: CloseIconProps): ReactElement {
  const [hovered, setHovered] = useState(false)

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onClose()
    }
  }

  return (
    <Flex
      direction="column"
      role={role}
      tabIndex={0}
      data-testid={testId}
      style={{ cursor: 'pointer' }}
      onClick={onClose}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <X size={size} color={hovered ? hoverColor : color} />
    </Flex>
  )
}
