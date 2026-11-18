import type { SpaceTokens } from '@universe/mycelium'
import { PlatformSplitStubError } from 'utilities/src/errors'

/** @internal */
export interface SettingsSheetStyles {
  /** Space under the Save button on a small screen (`media.sm`). */
  smallScreenSaveButtonPb: SpaceTokens
  framePx: SpaceTokens
  framePy: SpaceTokens
  titlePt: SpaceTokens
}

/** @internal Platform split base: bundlers resolve settingsSheetStyles.web or settingsSheetStyles.native. */
export const SETTINGS_SHEET_STYLES: SettingsSheetStyles = (() => {
  throw new PlatformSplitStubError('SETTINGS_SHEET_STYLES')
})()
