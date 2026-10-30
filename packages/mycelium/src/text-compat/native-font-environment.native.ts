/**
 * The device values the Text native style lane resolves fonts against:
 * which platform naming applies (iOS embedded family name vs Android file
 * name) and whether the locale skips the +1px `adjustedSize` bump.
 */
import { Platform } from 'react-native'
import type { NativeFontEnvironment } from './native-font'
import { needsSmallFont } from './needs-small-font'

// Locale is fixed for the app's lifetime; the legacy fonts.ts resolves its
// adjustedSize at module scope the same way (SegmentedControl.native precedent).
const SMALL_FONT = needsSmallFont()

export function nativeFontEnvironment(): NativeFontEnvironment {
  return { platform: Platform.OS === 'android' ? 'android' : 'ios', smallFont: SMALL_FONT }
}
