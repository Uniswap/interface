/**
 * Which `@universe/tailwind` css/theme.css variable each legacy Spore colour key reads.
 * Shared by the generator (labs/workbench/scripts/generate-theme-hooks-tokens.mts)
 * and the drift guard (semantic-colors.test.ts).
 */

/** Legacy JS key → theme.css var stem (`--color-<stem>-light` / `-dark`). */
export const SEMANTIC_COLOR_CSS_VARS: Record<string, string> = {
  neutral1: 'neutral1',
  neutral1Hovered: 'neutral1-hovered',
  neutral2: 'neutral2',
  neutral2Hovered: 'neutral2-hovered',
  neutral3: 'neutral3',
  neutral3Hovered: 'neutral3-hovered',
  surface1: 'surface1',
  surface1Hovered: 'surface1-hovered',
  surface2: 'surface2',
  surface2Hovered: 'surface2-hovered',
  surface3: 'surface3',
  surface3Solid: 'surface3-solid',
  surface3Hovered: 'surface3-hovered',
  surface4: 'surface4',
  surface5: 'surface5',
  surface5Hovered: 'surface5-hovered',
  accent1: 'accent1',
  accent1Hovered: 'accent1-hovered',
  accent2: 'accent2',
  accent2Hovered: 'accent2-hovered',
  accent2Solid: 'accent2-solid',
  accent3: 'accent3',
  accent3Hovered: 'accent3-hovered',
  statusSuccess: 'success',
  statusSuccessHovered: 'success-hovered',
  statusSuccess2: 'success-secondary',
  statusSuccess2Hovered: 'success-secondary-hovered',
  statusWarning: 'warning',
  statusWarningHovered: 'warning-hovered',
  statusWarning2: 'warning-secondary',
  statusWarning2Hovered: 'warning-secondary-hovered',
  statusCritical: 'critical',
  statusCriticalHovered: 'critical-hovered',
  statusCritical2: 'critical-secondary',
  statusCritical2Hovered: 'critical-secondary-hovered',
  poolsBrandGreen: 'pools-brand-green',
}

/** Theme-independent colours: legacy JS key → theme.css var stem (`--color-<stem>`). */
export const BASE_COLOR_CSS_VARS: Record<string, string> = {
  white: 'white',
  black: 'black',
  scrim: 'scrim',
}
