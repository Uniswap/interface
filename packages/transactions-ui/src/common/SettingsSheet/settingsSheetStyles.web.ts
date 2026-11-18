import type { SettingsSheetStyles } from '@universe/transactions-ui/src/common/SettingsSheet/settingsSheetStyles'

/**
 * @internal Web and extension values; native values live in settingsSheetStyles.native.ts.
 * The old layout keyed this on `media.sm && isWebPlatform`; platform style keys cannot
 * combine a breakpoint with a platform, so the web leg carries the small-screen value. The
 * frame and title spacing live here too: mycelium Flex drops `$platform-native` on native.
 */
export const SETTINGS_SHEET_STYLES: SettingsSheetStyles = {
  smallScreenSaveButtonPb: '$spacing24',
  framePx: '$spacing4',
  framePy: '$spacing4',
  titlePt: '$spacing8',
}
