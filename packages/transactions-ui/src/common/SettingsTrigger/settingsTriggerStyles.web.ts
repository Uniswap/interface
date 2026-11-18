import type { SettingsTriggerStyles } from '@universe/transactions-ui/src/common/SettingsTrigger/settingsTriggerStyles'

/**
 * @internal Web and extension values; native values live in settingsTriggerStyles.native.ts.
 * An icon size is not a style key, so it is tuned here, as TransactionSettingsButton did
 * with isWebPlatform.
 */
export const SETTINGS_TRIGGER_STYLES: SettingsTriggerStyles = {
  iconSize: '$icon.20',
  // The old frame's pool. It sits in the web leg because mycelium Flex leaks the web pool onto native.
  gearFrame: { '$platform-web': { cursor: 'pointer', transition: 'transform 80ms ease-out' } },
}
