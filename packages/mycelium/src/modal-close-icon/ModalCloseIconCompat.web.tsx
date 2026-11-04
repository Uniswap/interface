/**
 * Web leg of the `ModalCloseIcon` compat (INFRA-3282) — the drop-in
 * replacement for the legacy `ui/src` `ModalCloseIcon`: a TouchableArea
 * frame around the X glyph, hidden on the web app below the `sm` breakpoint
 * where the adaptive modal becomes a bottom sheet.
 *
 * Structure is the legacy structure — the same TouchableArea frame (via its
 * parity-proven compat port) wrapping the same X icon. Hover color is React
 * state on the icon, matching where legacy attaches it (the legacy icon
 * factory wires hover handlers onto the SVG itself, web only). Colors resolve
 * through `useSporeColors` so the full legacy palette is available —
 * `$neutral2Hovered`, the legacy default, is outside the icon factory's token
 * subset. The touchable's automatic color injection is off: it clones a
 * `$group-hover` prop onto children, which a DOM `<svg>` cannot carry, and
 * the explicit hover state already renders the same result.
 */
import { isWebApp } from '@universe/environment'
import { useState, type JSX } from 'react'
import { X } from '../components/icons/X'
import { useMedia, useSporeColors } from '../theme-hooks-compat'
import { TouchableAreaCompat } from '../touchable-area/TouchableAreaCompat'
import {
  DEFAULT_CLOSE_ICON_COLOR,
  DEFAULT_CLOSE_ICON_HOVER_COLOR,
  DEFAULT_CLOSE_ICON_ROLE,
  DEFAULT_CLOSE_ICON_SIZE,
  type ModalCloseIconProps,
} from './props'
import { resolveCloseIconColor } from './resolve'

export function ModalCloseIconCompat({
  onClose,
  size = DEFAULT_CLOSE_ICON_SIZE,
  color = DEFAULT_CLOSE_ICON_COLOR,
  hoverColor = DEFAULT_CLOSE_ICON_HOVER_COLOR,
  testId,
  role = DEFAULT_CLOSE_ICON_ROLE,
}: ModalCloseIconProps): JSX.Element {
  const media = useMedia()
  const colors = useSporeColors()
  const [hovered, setHovered] = useState(false)

  // Legacy hides the close icon where the interface's adaptive modal renders
  // as a bottom sheet (isWebApp && sm) — the sheet has its own dismissal.
  if (isWebApp && media.sm) {
    return <></>
  }

  return (
    <TouchableAreaCompat role={role} testID={testId} shouldAutomaticallyInjectColors={false} onPress={onClose}>
      <X
        size={size}
        color={resolveCloseIconColor(hovered ? hoverColor : color, colors)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />
    </TouchableAreaCompat>
  )
}
