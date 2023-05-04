/*
 * Need to fallback to support older browsers (mainly, Safari < 14).
 * See: https://developer.mozilla.org/en-US/docs/Web/API/MediaQueryList#browser_compatibility
 */
export function addListener(mediaQuery: MediaQueryList, listener: (event: MediaQueryListEvent) => void) {
  try {
    mediaQuery.addEventListener('change', listener)
  } catch (e) {
    mediaQuery.addListener(listener)
  }
}

export function removeListener(mediaQuery: MediaQueryList, listener: (event: MediaQueryListEvent) => void) {
  try {
    mediaQuery.removeEventListener('change', listener)
  } catch (e) {
    mediaQuery.removeListener(listener)
  }
}
