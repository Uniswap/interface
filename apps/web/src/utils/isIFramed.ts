export function isIFramed(redirect = false): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (window.location.ancestorOrigins !== undefined) {
      // Does not exist in IE and firefox.
      // See https://developer.mozilla.org/en-US/docs/Web/API/Location/ancestorOrigins for how this works
      if (window.location.ancestorOrigins.length > 0) {
        if (redirect && window.top) {
          // nosemgrep: javascript.browser.tainted-redirect.tainted-redirect
          // Justification: This is anti-clickjacking protection (frame-busting).
          // window.self.location.href is the current page's own URL, not user-controlled input.
          // We're breaking out of an iframe by redirecting the top frame to our own URL.
          window.top.location = window.self.location.href
        }
        return true
      }
    }
    if (window.self !== window.top) {
      // For IE and Firefox
      // See https://cheatsheetseries.owasp.org/cheatsheets/Clickjacking_Defense_Cheat_Sheet.html for how this works
      if (redirect && window.top) {
        // nosemgrep: javascript.browser.tainted-redirect.tainted-redirect
        // Justification: This is anti-clickjacking protection (frame-busting).
        // window.self.location.href is the current page's own URL, not user-controlled input.
        // We're breaking out of an iframe by redirecting the top frame to our own URL.
        window.top.location = window.self.location.href
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
