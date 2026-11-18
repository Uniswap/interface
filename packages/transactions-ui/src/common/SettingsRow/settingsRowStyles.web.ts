import type { SettingsRowStyles } from '@universe/transactions-ui/src/common/SettingsRow/settingsRowStyles'

/**
 * @internal Web and extension values; native values live in settingsRowStyles.native.ts.
 * Not `$platform-native`: mycelium Flex drops that pool on native.
 */
export const SETTINGS_ROW_STYLES: SettingsRowStyles = {
  listGap: '$spacing4',
  listPy: '$spacing8',
}
