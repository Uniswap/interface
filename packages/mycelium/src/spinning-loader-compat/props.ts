/**
 * The `SpinningLoader` compat prop contract
 * (INFRA-3644), carried over from the deleted Tamagui-free ui rebuild
 * (INFRA-3286). Platform-neutral: no react-native imports.
 */
import type { IconProps } from '../components/factories/createIcon'

export type SpinningLoaderCompatProps = {
  size?: number
  disabled?: boolean
  // Forwarded verbatim to the CircleSpinner icon, so the icon's own color surface is the
  // honest type (a superset of the legacy ColorTokens union — no consumer breaks).
  color?: IconProps['color']
  /** Web only: skips the sized/centered frames around the rotating glyph; the native leg ignores it, matching the legacy leg. */
  unstyled?: boolean
}
