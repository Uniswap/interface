import { iconSizes } from 'ui/src/theme'

// Avoid `all` — see CLAUDE.md. Shared layout/motion props only (no `background-color` here).
export const HEADER_TRANSITION =
  'opacity 0.2s ease, transform 0.2s ease, width 0.2s ease, height 0.2s ease, gap 0.2s ease, ' +
  'padding-top 0.2s ease, padding-bottom 0.2s ease, font-size 0.2s ease, line-height 0.2s ease'

export const HEADER_LOGO_SIZE = {
  small: iconSizes.icon28,
  compact: iconSizes.icon40,
  medium: iconSizes.icon48,
  expanded: iconSizes.icon56,
}

/** Size for header action button placeholders (e.g. TDP skeleton, Pool Details header). */
export const ACTION_BUBBLE_SIZE = { width: 42, height: 34 }
