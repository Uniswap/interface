import type { FlexProps, IconSizeTokens } from '@universe/mycelium'
import { PlatformSplitStubError } from 'utilities/src/errors'

/** @internal */
export interface SettingsTriggerStyles {
  iconSize: IconSizeTokens
  /** The gear's frame: pointer cursor and the hover spin's timing, on web and extension only. */
  gearFrame: Pick<FlexProps, '$platform-web'>
}

/** @internal Platform split base: bundlers resolve settingsTriggerStyles.web or settingsTriggerStyles.native. */
export const SETTINGS_TRIGGER_STYLES: SettingsTriggerStyles = (() => {
  throw new PlatformSplitStubError('SETTINGS_TRIGGER_STYLES')
})()
