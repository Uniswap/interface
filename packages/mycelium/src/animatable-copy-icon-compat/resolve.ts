/**
 * Platform-neutral color resolution shared by both `AnimatableCopyIconCompat`
 * legs (the `modal-close-icon/resolve.ts` mechanism).
 */
import type { SporeColor, SporeColorKey, UseSporeColorsReturn } from '../theme-hooks-compat'

/**
 * Resolve a `$`-color token through the `useSporeColors` theme map — `.val`
 * is the active theme's resolved literal, which the icon `color` prop
 * accepts. Non-token strings pass through unchanged; a `$`-token outside the
 * theme map throws — same as FlexCompat — rather than reaching the leaf raw.
 */
export function resolveCopyIconColor(value: string, colors: UseSporeColorsReturn): string {
  if (!value.startsWith('$')) {
    return value
  }
  const entry = (colors as Partial<Record<SporeColorKey, SporeColor>>)[value as SporeColorKey]
  if (entry === undefined) {
    throw new Error(`AnimatableCopyIcon: color token "${value}" has no theme counterpart`)
  }
  return entry.val
}
