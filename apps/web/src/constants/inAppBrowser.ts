/**
 * Bottom chrome an Android in-app browser (Trust Wallet, MetaMask, Telegram, …) draws over the WebView:
 * its own toolbar plus the OS navigation bar beneath it. Measured at 90-130px on an Android Trust Wallet
 * session; 144 clears the upper end with a margin. iOS in-app browsers do not overlay the WebView.
 *
 * In-app browser chrome is invisible to every viewport unit and to `visualViewport`, so it cannot be
 * derived at runtime and has to be a fixed allowance. Gate it on `isInAppBrowser()` on Android.
 *
 * `env(safe-area-inset-bottom)` is 0 without `viewport-fit=cover`; once that lands this
 * double-counts the OS navigation bar and must come down.
 *
 * Shared so the layout that reserves the band and the e2e test that asserts it cannot drift apart.
 */
export const IN_APP_BROWSER_CHROME_PX = 144
