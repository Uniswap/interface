import { isMobileWeb, isWebIOS } from '@universe/environment'

/**
 * Return path the fiat on-ramp widget sends mobile-web users back to after checkout.
 *
 * The native apps claim `/buy` as a universal/app link (iOS AASA `/buy/*` in
 * `public/.well-known/apple-app-site-association`, Android `pathPrefix: /buy` in the
 * mobile manifest), so a mobile-browser navigation to `/buy` opens the native app when
 * it is installed. This path must stay outside every app-claimed prefix; the router
 * forwards it to `/buy` client-side (see `OnRampReturn`).
 */
export const ON_RAMP_RETURN_PATH = '/onramp-return'

const BUY_PATH = '/buy'

// isMobileWeb misses iPadOS Safari (desktop user agent); isWebIOS catches it.
const isAppLinkCapableBrowser = isMobileWeb || isWebIOS

/**
 * Builds the `redirectUrl` a fiat on-ramp or CEX-transfer widget navigates back to
 * after checkout: `<origin>/buy` on desktop, `<origin>/onramp-return` on mobile web
 * so the return stays in the web session instead of deep-linking into the native app.
 */
export function getOnRampRedirectUrl({
  origin,
  isMobileWebBrowser = isAppLinkCapableBrowser,
}: {
  origin: string
  isMobileWebBrowser?: boolean
}): string {
  return new URL(isMobileWebBrowser ? ON_RAMP_RETURN_PATH : BUY_PATH, origin).toString()
}
