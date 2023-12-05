// Need to fallback to support older browsers (mainly, Safari < 14).
// See: https://developer.mozilla.org/en-US/docs/Web/API/MediaQueryList#browser_compatibility

export function addMediaQueryListener(mediaQuery: MediaQueryList, listener: (event: MediaQueryListEvent) => void) {
  try {
    mediaQuery.addEventListener('change', listener)
  } catch (e) {
    mediaQuery.addListener(listener)
  }
}

export function removeMediaQueryListener(mediaQuery: MediaQueryList, listener: (event: MediaQueryListEvent) => void) {
  try {
    mediaQuery.removeEventListener('change', listener)
  } catch (e) {
    mediaQuery.removeListener(listener)
  }
}
