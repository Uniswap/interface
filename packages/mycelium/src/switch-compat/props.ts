/**
 * The `Switch` compat prop contract and shared geometry (INFRA-3644),
 * transcribed from the Tamagui-free `ui/src` Switch it replaced (INFRA-3318)
 * and re-sourced onto mycelium tokens.
 * Platform-neutral: no react-native imports.
 */
import type { CSSProperties } from 'react'
import { spacing } from '../tokens'

/** The legacy `ui/src/components/types` SporeComponentVariant union, inlined. */
export type SwitchCompatVariant = 'branded' | 'default'

export const SWITCH_THUMB_HEIGHT = spacing.spacing24
export const SWITCH_THUMB_PADDING = spacing.spacing4
export const SWITCH_TRACK_HEIGHT = SWITCH_THUMB_HEIGHT + SWITCH_THUMB_PADDING * 2
export const SWITCH_TRACK_WIDTH = spacing.spacing60

/** The size every legacy Switch leg renders its check icon at. */
export const SWITCH_CHECK_ICON_SIZE = 14

/**
 * check.svg's own stroke width. The icon factory's default root `strokeWidth`
 * (8) would override it, so the native leg passes it explicitly to keep the
 * glyph it drew by hand before.
 */
export const SWITCH_CHECK_STROKE_WIDTH = 5

/**
 * Local replacement for the Tamagui `SwitchProps` the legacy component used to
 * extend, kept to the prop surface consumers actually use so nothing
 * Tamagui-shaped leaks through the public API — the legacy `SwitchProps`
 * contract, verbatim.
 */
export type SwitchCompatProps = {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  variant: SwitchCompatVariant
  testID?: string
  /** Web only: forwarded to the underlying `button[role=switch]`; the native leg's narrowed contract omits it, matching the legacy leg. */
  id?: string
  pointerEvents?: 'auto' | 'none' | 'box-none' | 'box-only'
  /** Web only: overrides the resolved track color. Accepts a Spore color token (e.g. `$surface3`) or a raw color. */
  backgroundColor?: string
  /** Web only: extra inline styles merged in while disabled (legacy Tamagui `disabledStyle`). */
  disabledStyle?: CSSProperties
  /** Web only: accessible name, for when the visible label beside the switch is shortened. */
  'aria-label'?: string
  'aria-describedby'?: string
}
