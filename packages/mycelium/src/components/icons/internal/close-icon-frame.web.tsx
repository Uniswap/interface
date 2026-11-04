/**
 * Web leg of `CloseIconWithHover`: a DOM Flex with mouse hover and Enter/Space
 * handling. Lives under `internal/` because the `./icons/*` exports map takes
 * an icon's `.tsx` file literally (a per-icon `.native.tsx` twin is never
 * resolved), and the icon generator's census treats every top-level `.tsx` in
 * `icons/` as an icon component.
 */
import { useState } from 'react'
import type { KeyboardEvent, ReactElement } from 'react'
import { FlexCompat as Flex } from '../../../flex-compat/FlexCompat'
import type { CloseIconProps } from '../CloseIconWithHover'
import { X } from '../X'

// `--neutral2-hovered` ships with the missing-token-families import (INFRA-2951); until it lands the hover color falls back to `--neutral2`.
export function CloseIconFrame({
  onClose,
  size,
  color = 'var(--neutral2)',
  hoverColor = 'var(--neutral2-hovered, var(--neutral2))',
  testId,
  role,
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
      justifyContent="flex-start"
      flexDirection="column"
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
