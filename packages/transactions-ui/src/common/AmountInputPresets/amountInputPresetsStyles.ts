import { PlatformSplitStubError } from 'utilities/src/errors'

/** @internal */
export interface AmountInputPresetsStyles {
  /**
   * Web explains a disabled preset in a hover tooltip. Native has no hover: the host opens
   * its modal from `onPressDisabledPreset` instead, as MaxBalanceInfoModal did.
   */
  showDisabledTooltip: boolean
}

/** @internal Platform split base: bundlers resolve amountInputPresetsStyles.web or amountInputPresetsStyles.native. */
export const AMOUNT_INPUT_PRESETS_STYLES: AmountInputPresetsStyles = (() => {
  throw new PlatformSplitStubError('AMOUNT_INPUT_PRESETS_STYLES')
})()
