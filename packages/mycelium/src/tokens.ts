/**
 * Token-constants compat for the Tamagui→Tailwind migration (INFRA-2951).
 *
 * Drop-in equivalents of the ui/src/theme constant families, derived from
 * `@universe/tailwind` — never from copied ui literals. The tailwind TS
 * mirror is itself pinned to that package's css/theme.css by derivation
 * honesty guards (packages/tailwind/src/tokens.guard.test.ts, plus Layer 2 of
 * tokens.parity.test.ts here), so ui values can only enter through the token
 * package. Exit test: tokens.parity.test.ts.
 */
import {
  fonts as tailwindFonts,
  iconSizes as tailwindIconSizes,
  radii,
  spacing as tailwindSpacing,
  zIndexes as tailwindZIndexes,
} from '@universe/tailwind'

/** ui/src/theme/iconSizes.ts keys over the `--icon-size-*` values. */
export const iconSizes = {
  icon8: tailwindIconSizes['8'],
  icon12: tailwindIconSizes['12'],
  icon14: tailwindIconSizes['14'],
  icon16: tailwindIconSizes['16'],
  icon18: tailwindIconSizes['18'],
  icon20: tailwindIconSizes['20'],
  icon24: tailwindIconSizes['24'],
  icon28: tailwindIconSizes['28'],
  icon32: tailwindIconSizes['32'],
  icon36: tailwindIconSizes['36'],
  icon40: tailwindIconSizes['40'],
  icon44: tailwindIconSizes['44'],
  icon48: tailwindIconSizes['48'],
  icon56: tailwindIconSizes['56'],
  icon64: tailwindIconSizes['64'],
  icon70: tailwindIconSizes['70'],
  icon100: tailwindIconSizes['100'],
}

/** ui/src/theme/spacing.ts keys over the `--ui-spacing-*` values. */
export const spacing = {
  none: tailwindSpacing.none,
  spacing1: tailwindSpacing['1'],
  spacing2: tailwindSpacing['2'],
  spacing4: tailwindSpacing['4'],
  spacing6: tailwindSpacing['6'],
  spacing8: tailwindSpacing['8'],
  spacing12: tailwindSpacing['12'],
  spacing16: tailwindSpacing['16'],
  spacing18: tailwindSpacing['18'],
  spacing20: tailwindSpacing['20'],
  spacing24: tailwindSpacing['24'],
  spacing28: tailwindSpacing['28'],
  spacing32: tailwindSpacing['32'],
  spacing36: tailwindSpacing['36'],
  spacing40: tailwindSpacing['40'],
  spacing48: tailwindSpacing['48'],
  spacing60: tailwindSpacing['60'],
}

/** ui/src/theme/zIndexes.ts keys over the `--z-index-*` values. */
export const zIndexes = {
  negative: tailwindZIndexes.negative,
  background: tailwindZIndexes.background,
  default: tailwindZIndexes.default,
  mask: tailwindZIndexes.mask,
  dropdown: tailwindZIndexes.dropdown,
  header: tailwindZIndexes.header,
  sidebar: tailwindZIndexes.sidebar,
  sticky: tailwindZIndexes.sticky,
  fixed: tailwindZIndexes.fixed,
  modalBackdrop: tailwindZIndexes['modal-backdrop'],
  offcanvas: tailwindZIndexes.offcanvas,
  modal: tailwindZIndexes.modal,
  popoverBackdrop: tailwindZIndexes['popover-backdrop'],
  popover: tailwindZIndexes.popover,
  tooltip: tailwindZIndexes.tooltip,
  overlay: tailwindZIndexes.overlay,
  toast: tailwindZIndexes.toast,
}

/**
 * ui/src/theme/fonts.ts variants over the `@universe/tailwind` ui-parity
 * `fonts` tokens (`--typography-*`) — not the re-cut `--text-*` web scale,
 * whose reconciliation with ui stays a separate effort (#35388).
 */
export const fonts = {
  heading1: tailwindFonts['heading-1'],
  heading2: tailwindFonts['heading-2'],
  heading3: tailwindFonts['heading-3'],
  subheading1: tailwindFonts['subheading-1'],
  subheading2: tailwindFonts['subheading-2'],
  body1: tailwindFonts['body-1'],
  body2: tailwindFonts['body-2'],
  body3: tailwindFonts['body-3'],
  body4: tailwindFonts['body-4'],
  body5: tailwindFonts['body-5'],
  buttonLabel1: tailwindFonts['button-label-1'],
  buttonLabel2: tailwindFonts['button-label-2'],
  buttonLabel3: tailwindFonts['button-label-3'],
  buttonLabel4: tailwindFonts['button-label-4'],
  monospace: tailwindFonts.monospace,
}

/** ui/src/theme/borderRadii.ts keys over the `@universe/tailwind` `--radius-*` values. */
export const borderRadii = {
  none: radii.none,
  rounded4: radii['4'],
  rounded6: radii['6'],
  rounded8: radii['8'],
  rounded12: radii['12'],
  rounded16: radii['16'],
  rounded20: radii['20'],
  rounded24: radii['24'],
  rounded32: radii['32'],
  roundedFull: radii.full,
}
