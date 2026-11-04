/**
 * The PLATFORM-INVARIANT constant families (icon/image sizes, spacing, heights,
 * z-indexes, radii), split out of ./tokens.ts. Derived from
 * `@universe/tailwind` — never from copied literals. The tailwind TS mirror is
 * pinned to that package's css/theme.css by
 * packages/tailwind/src/tokens.guard.test.ts.
 *
 * A LEAF module, apart from the `./tokens` barrel, because the barrel's
 * platform-resolved `fonts` reaches into ./text-compat and ./compat/tokens.ts
 * reads `zIndexes` — importing the barrel there would close an initialization
 * cycle. Consumers outside the package import `@universe/mycelium/tokens`.
 */
import {
  heights as tailwindHeights,
  iconSizes as tailwindIconSizes,
  imageSizes as tailwindImageSizes,
  radii,
  spacing as tailwindSpacing,
  zIndexes as tailwindZIndexes,
} from '@universe/tailwind'

/** Legacy ui `iconSizes` keys over the `--icon-size-*` values. */
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

/** Legacy ui `imageSizes` keys over the `--image-size-*` values. */
export const imageSizes = {
  image12: tailwindImageSizes['12'],
  image16: tailwindImageSizes['16'],
  image20: tailwindImageSizes['20'],
  image24: tailwindImageSizes['24'],
  image32: tailwindImageSizes['32'],
  image36: tailwindImageSizes['36'],
  image40: tailwindImageSizes['40'],
  image48: tailwindImageSizes['48'],
  image64: tailwindImageSizes['64'],
  image100: tailwindImageSizes['100'],
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

/** The `--height-*` values (ui's former `INTERFACE_NAV_HEIGHT` is `interface-nav`). */
export const heights = {
  'interface-nav': tailwindHeights['interface-nav'],
}

/** Legacy ui `zIndexes` keys over the `--z-index-*` values. */
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

/** Legacy ui `borderRadii` keys over the `@universe/tailwind` `--radius-*` values. */
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

/** Extra touch target around small pressables; the parent needs matching padding for it to work. */
export const defaultHitslop = 5

/** The Basel web font stack, as the legacy cascade emitted it inline. */
export const WEB_BASEL_FONT_STACK =
  'Basel, -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'

/** Native line-height multiplier: the Basel font files render a few px low without it. */
export const NATIVE_LINE_HEIGHT_SCALE = 1.15
