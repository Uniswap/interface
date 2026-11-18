import { PlatformSplitStubError } from 'utilities/src/errors'

/** @internal */
export interface TokenLogoStyles {
  /** Border around the network and count badges, separating them from the logo. */
  badgeBorderWidth: number
  /**
   * The white disc behind the image. Native shows it from the first render to skip a
   * re-render; web waits for the image to load so a fallback badge never sits on white.
   */
  showBackgroundBeforeLoad: boolean
  /** Native drops the text variant's line height so `adjustsFontSizeToFit` shrinks the line box too. */
  fallbackLineHeight: 'unset' | undefined
  /** Native shrinks a count that does not fit ("99+"); web lets it overflow the square instead of ellipsizing. */
  fitCountText: boolean
}

/** @internal Platform split base: bundlers resolve tokenLogoStyles.web or tokenLogoStyles.native. */
export const TOKEN_LOGO_STYLES: TokenLogoStyles = (() => {
  throw new PlatformSplitStubError('TOKEN_LOGO_STYLES')
})()
