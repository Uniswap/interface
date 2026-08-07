import { isEmbedPath } from '~/pages/embedPaths'

// Frame-busting (anti-clickjacking) must land the user on the full top-level app,
// preserving query params and hash:
//   - `bustToPath` (e.g. Send → '/send'): always break out to that top-level path so
//     the user can still finish an action the clickjacking policy disallows in a frame.
//   - Otherwise an /embed document busts to /swap (which hosts the passkey /
//     embedded-wallet flow); any other frame keeps the page's own URL.
function frameBustHref(bustToPath?: string): string {
  const { origin, pathname, search, hash } = window.self.location
  const target = bustToPath ?? (isEmbedPath(pathname) ? '/swap' : undefined)
  return target ? `${origin}${target}${search}${hash}` : window.self.location.href
}

export function isIFramed(redirect = false, options?: { bustToPath?: string }): boolean {
  try {
    // oxlint-disable-next-line typescript/no-unnecessary-condition
    if (window.location.ancestorOrigins !== undefined) {
      // Does not exist in IE and firefox.
      // See https://developer.mozilla.org/en-US/docs/Web/API/Location/ancestorOrigins for how this works
      if (window.location.ancestorOrigins.length > 0) {
        if (redirect && window.top) {
          // Justification: This is anti-clickjacking protection (frame-busting).
          // frameBustHref() only ever returns the current page's own origin plus a fixed
          // same-origin path (/swap or /send) or the page's own URL — never attacker-controlled input.
          // nosemgrep: javascript.browser.tainted-redirect.tainted-redirect
          window.top.location.href = frameBustHref(options?.bustToPath)
        }
        return true
      }
    }
    if (window.self !== window.top) {
      // For IE and Firefox
      // See https://cheatsheetseries.owasp.org/cheatsheets/Clickjacking_Defense_Cheat_Sheet.html for how this works
      if (redirect && window.top) {
        // Justification: This is anti-clickjacking protection (frame-busting).
        // frameBustHref() only ever returns the current page's own origin plus a fixed
        // same-origin path (/swap or /send) or the page's own URL — never attacker-controlled input.
        // nosemgrep: javascript.browser.tainted-redirect.tainted-redirect
        window.top.location.href = frameBustHref(options?.bustToPath)
      }
      return true
    }
  } catch {
    // this should never be called, but just in we are being iframed in an old browser where an attacker can overwrite these variables
    if (redirect) {
      throw new Error('isIFramed: should redirect, but unable to determine if framed')
    }
    return true // fail closed and say we are being iframed if we can't determine if we are being iframed
  }

  return false
}
