/**
 * Tamagui-compatible theme hooks (INFRA-2952): the same shapes and values as
 * the `ui/src` versions under both themes, on web and native (INFRA-2353).
 * The parity suite in `packages/tailwind/src/parity/theme-hooks` is the
 * drift guard.
 */
export { opacify, opacifyRaw } from './opacify'
export {
  BREAKPOINT_PX,
  // `DARK_THEME_COLORS`/`LIGHT_THEME_COLORS` are theme-pinned static maps, for module-level non-React
  // consumers that must stay theme-invariant; anything that should follow the theme wants `useSporeColors`.
  DARK_THEME_COLORS,
  HEIGHT_BREAKPOINT_PX,
  LIGHT_THEME_COLORS,
  type MediaQueryKey,
  THEME_COLOR_NAMES,
  type ThemeColorName,
} from './tokens'
export { DEFAULT_BOTTOM_INSET, MobileDeviceHeight } from './device-height'
export { useColorSchemeFromSeed, type SeedColor, type UseColorSchemeFromSeedReturn } from './useColorSchemeFromSeed'
export { useColorsFromTokenColor, type UseColorsFromTokenColorReturn } from './useColorsFromTokenColor'
export { useDeviceDimensions, type DeviceDimensions } from './useDeviceDimensions'
export { useIsDarkMode } from './useIsDarkMode'
export { useIsTouchDevice } from './useIsTouchDevice'
export { useMedia, type MediaState } from './useMedia'
export { useScrollbarStyles } from './useScrollbarStyles'
export { useShadowPropsMedium, useShadowPropsShort, type ShadowProps } from './useShadowProps'
export { useExtractedColors } from './extracted-colors'
export { passesContrast } from './token-color-utils'
export { type TokenColorOverrides, useExtractedTokenColor } from './useExtractedTokenColor'
export { useIsShortMobileDevice } from './useIsShortMobileDevice'
export {
  useSporeColors,
  type DynamicColor,
  type SporeColor,
  type SporeColorKey,
  type SporeThemeColorToken,
  type UseSporeColorsReturn,
} from './useSporeColors'
export { useSporeColorsForTheme } from './useSporeColorsForTheme'
