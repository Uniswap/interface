import { PlatformSplitStubError } from 'utilities/src/errors'

/** @internal */
export interface SlippageScreenStyles {
  /** The text input takes raw styles from its host component, so the font family is set by hand. */
  inputFontFamily?: string
}

/** @internal Platform split base: bundlers resolve slippageScreenStyles.web or slippageScreenStyles.native. */
export const SLIPPAGE_SCREEN_STYLES: SlippageScreenStyles = (() => {
  throw new PlatformSplitStubError('SLIPPAGE_SCREEN_STYLES')
})()
