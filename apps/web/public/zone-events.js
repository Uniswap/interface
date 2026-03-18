/**
 * zone-events.ts  – TEMP shim for Tamagui scroll-lock bug
 *   → Must run **before** `@tamagui/polyfill-dev` is imported.
 */

// Browsers that default key events (`touchmove`, `wheel`) to passive:true
// and therefore emit the Chrome "Unable to preventDefault …" intervention.
const IS_BLINK_BASED = /\b(?:Chrome|CriOS|SamsungBrowser|Opera|Edg)\/\d+/i.test(navigator.userAgent)

;(() => {
  const nativeAdd = EventTarget.prototype.addEventListener
  const nativeRm = EventTarget.prototype.removeEventListener

  function normalizeOpts(opts) {
    if (opts == null) {
      return false
    }
    if (typeof opts === 'boolean' || IS_BLINK_BASED) {
      return opts
    }
    return !!opts.capture
  }

  // eslint-disable-next-line max-params
  EventTarget.prototype.addEventListener = function (type, cb, opts) {
    return nativeAdd.call(this, type, cb, normalizeOpts(opts))
  }

  // eslint-disable-next-line max-params
  EventTarget.prototype.removeEventListener = function (type, cb, opts) {
    return nativeRm.call(this, type, cb, normalizeOpts(opts))
  }
})()
