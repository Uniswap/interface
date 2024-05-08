export function isIFramed(redirect = false): boolean {
  try {
    if (location.ancestorOrigins !== undefined) {
      // Does not exist in IE and firefox.
      // See https://developer.mozilla.org/en-US/docs/Web/API/Location/ancestorOrigins for how this works
      if (location.ancestorOrigins.length > 0) {
        if (redirect && top) {
          top.location = self.location
        }
        return true
      }
    }
    if (self !== top) {
      // For IE and Firefox
      // See https://cheatsheetseries.owasp.org/cheatsheets/Clickjacking_Defense_Cheat_Sheet.html for how this works
      if (redirect && top) {
        top.location = self.location
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
