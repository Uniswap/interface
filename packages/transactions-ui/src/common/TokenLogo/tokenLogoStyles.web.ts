import type { TokenLogoStyles } from '@universe/transactions-ui/src/common/TokenLogo/tokenLogoStyles'

/**
 * @internal Web and extension values; native values live in tokenLogoStyles.native.ts.
 * Same layout everywhere. These are the values the old TokenLogo switched on isMobileApp.
 */
export const TOKEN_LOGO_STYLES: TokenLogoStyles = {
  badgeBorderWidth: 1.5,
  showBackgroundBeforeLoad: false,
  fallbackLineHeight: undefined,
  fitCountText: false,
}
