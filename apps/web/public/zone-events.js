/**
 * zone-events.ts  – TEMP shim for Tamagui scroll-lock bug
 *   → Must run **before** `@tamagui/polyfill-dev` is imported.
 *
 * Adapted from Zone.js (MIT); only the add/removeEventListener patch is kept.
 */
;(() => {
  const nativeAdd = EventTarget.prototype.addEventListener
  const nativeRm = EventTarget.prototype.removeEventListener

  function normalizeOpts(opts) {
    if (opts == null) {
      return false
    }
    if (typeof opts === 'boolean') {
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
