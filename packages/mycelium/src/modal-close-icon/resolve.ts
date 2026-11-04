/**
 * Platform-neutral pieces shared by both `ModalCloseIconCompat` legs — the
 * size/color resolution. Sharing them is what keeps the two legs rendering the
 * same icon (the `checkbox-compat` mechanism).
 */
import { ICON_SIZE_TOKEN_PX, lookupToken, type SporeIconSizeToken } from '../compat/tokens'
import type { SporeColor, SporeColorKey, UseSporeColorsReturn } from '../theme-hooks-compat'

/** Resolve legacy `$icon.N` size tokens to px; numbers pass through. Unknown tokens throw — same as the icon factory. */
export function closeIconSizePx(size: SporeIconSizeToken | number): number {
  if (typeof size === 'number') {
    return size
  }
  const px = lookupToken(ICON_SIZE_TOKEN_PX, size)
  if (px === undefined) {
    throw new Error(`ModalCloseIcon: unknown icon size token "${size}"`)
  }
  return px
}

/**
 * Resolve a `$`-color token through the `useSporeColors` theme map — the full
 * legacy palette (every key legacy Tamagui themes carry, `$neutral2Hovered`
 * included), unlike the icon factory's token subset. `.val` is the active
 * theme's resolved literal, which both a DOM `style.color` and a
 * `react-native-svg` `fill` accept. Non-token strings pass through unchanged;
 * a `$`-token outside the theme map throws — same as FlexCompat — rather than
 * reaching the leaf raw.
 */
export function resolveCloseIconColor(value: string, colors: UseSporeColorsReturn): string {
  if (!value.startsWith('$')) {
    return value
  }
  const entry = (colors as Partial<Record<SporeColorKey, SporeColor>>)[value as SporeColorKey]
  if (entry === undefined) {
    throw new Error(`ModalCloseIcon: color token "${value}" has no theme counterpart`)
  }
  return entry.val
}
