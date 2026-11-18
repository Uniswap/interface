import { PlatformSplitStubError } from 'utilities/src/errors'

/** @internal */
export interface AmountInputStyles {
  /**
   * Native applies the caller's `selection`, so a decimal pad can place the caret. Web
   * leaves the caret to the browser, as the old panel did.
   */
  applySelection: boolean
  /** Shrink of the field row. Native keeps it at 0 so a long amount never squeezes the prefix. */
  fieldShrink: number
}

/** @internal Platform split base: bundlers resolve amountInputStyles.web or amountInputStyles.native. */
export const AMOUNT_INPUT_STYLES: AmountInputStyles = (() => {
  throw new PlatformSplitStubError('AMOUNT_INPUT_STYLES')
})()
