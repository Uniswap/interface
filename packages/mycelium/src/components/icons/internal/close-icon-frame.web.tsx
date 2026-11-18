/**
 * Web leg of `CloseIconWithHover`: a TouchableArea (so it has a tab stop and Enter/Space activation
 * like every other icon-only button) with a hover color. Lives under `internal/` because the
 * `./icons/*` exports map takes an icon's `.tsx` file literally (a per-icon `.native.tsx` twin is
 * never resolved), and the icon generator's census treats every top-level `.tsx` in `icons/` as an
 * icon component.
 */
import { useState } from 'react'
import type { ReactElement } from 'react'
import { TouchableAreaCompat as TouchableArea } from '../../../touchable-area/TouchableAreaCompat'
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
  'aria-label': ariaLabel,
}: CloseIconProps): ReactElement {
  const [hovered, setHovered] = useState(false)

  const handleHoverIn = (): void => setHovered(true)
  const handleHoverOut = (): void => setHovered(false)

  return (
    <TouchableArea
      justifyContent="flex-start"
      flexDirection="column"
      // The X takes its colour from the hover state here, not from the pressable's colour injection.
      shouldAutomaticallyInjectColors={false}
      role={role}
      aria-label={ariaLabel}
      testID={testId}
      onPress={onClose}
      onHoverIn={handleHoverIn}
      onHoverOut={handleHoverOut}
    >
      <X size={size} color={hovered ? hoverColor : color} />
    </TouchableArea>
  )
}
