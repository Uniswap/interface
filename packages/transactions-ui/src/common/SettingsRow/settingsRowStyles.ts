import type { SpaceTokens } from '@universe/mycelium'
import { PlatformSplitStubError } from 'utilities/src/errors'

/** @internal */
export interface SettingsRowStyles {
  listGap: SpaceTokens
  listPy: SpaceTokens
}

/** @internal Platform split base: bundlers resolve settingsRowStyles.web or settingsRowStyles.native. */
export const SETTINGS_ROW_STYLES: SettingsRowStyles = (() => {
  throw new PlatformSplitStubError('SETTINGS_ROW_STYLES')
})()
