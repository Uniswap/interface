/**
 * The `ModalCloseIcon` compat prop contract (INFRA-3282): the legacy
 * `CloseIconProps` surface (the props `ui/src`'s `ModalCloseIcon` took)
 * carried name-for-name, so
 * `<ModalCloseIcon testId={…} role="none" onClose={…} />` call sites convert
 * as a mechanical barrel swap.
 *
 * A closed interface with no rest spread, exactly like legacy — an attribute
 * outside this surface fails typecheck on both systems, so the swap needs no
 * codemod prop gate.
 */
import type { SporeColorToken, SporeIconSizeToken } from '../compat/tokens'

/**
 * Legacy widens color to `ColorTokens | (string & {})`; the compat keeps the
 * `$`-token half in autocomplete and lets raw CSS colors and `var()`
 * expressions through. `$`-tokens resolve through the `useSporeColors` theme
 * map (the full legacy palette, `$neutral2Hovered` included), not the icon
 * factory's narrower token subset.
 */
export type ModalCloseIconColor = SporeColorToken | (string & {})

export interface ModalCloseIconProps {
  onClose: () => void
  size?: SporeIconSizeToken | number
  color?: ModalCloseIconColor
  hoverColor?: ModalCloseIconColor
  testId?: string
  role?: 'button' | 'none'
}

/** Legacy defaults (`CloseIconWithHover.tsx`). */
export const DEFAULT_CLOSE_ICON_SIZE: SporeIconSizeToken = '$icon.24'
export const DEFAULT_CLOSE_ICON_COLOR = '$neutral2'
export const DEFAULT_CLOSE_ICON_HOVER_COLOR = '$neutral2Hovered'
export const DEFAULT_CLOSE_ICON_ROLE = 'button'
