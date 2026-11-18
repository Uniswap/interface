import { PlatformSplitStubError } from 'utilities/src/errors'

/** @internal */
export interface DeadlineScreenStyles {
  /** The text input takes raw styles from its host component, so the font family is set by hand. */
  inputFontFamily?: string
}

/** @internal Platform split base: bundlers resolve deadlineScreenStyles.web or deadlineScreenStyles.native. */
export const DEADLINE_SCREEN_STYLES: DeadlineScreenStyles = (() => {
  throw new PlatformSplitStubError('DEADLINE_SCREEN_STYLES')
})()
