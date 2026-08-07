/**
 * Tamagui-compatible theme hooks (INFRA-2952), web legs: the same shapes and
 * values as the `ui/src` versions under both themes. Native legs are throwing
 * stubs until the native parity harness lands (INFRA-2353). The parity suite
 * in `packages/tailwind/src/parity/theme-hooks` is the drift guard.
 */
export { opacify, opacifyRaw } from './opacify'
export {
  BREAKPOINT_PX,
  HEIGHT_BREAKPOINT_PX,
  type MediaQueryKey,
  THEME_COLOR_NAMES,
  type ThemeColorName,
} from './tokens'
export { useDeviceDimensions, type DeviceDimensions } from './useDeviceDimensions'
export { useIsDarkMode } from './useIsDarkMode'
export { useMedia, type MediaState } from './useMedia'
export {
  useSporeColors,
  type DynamicColor,
  type SporeColor,
  type SporeColorKey,
  type UseSporeColorsReturn,
} from './useSporeColors'
