// Make jsdom read like the desktop browser the suites are written against. Load it before anything
// else (React DOM picks its animation event names at import). No-op outside a DOM environment.
// Plain JS, like setup.js: the app tsconfigs are composite projects that can't list a .ts file
// outside their own tree.

if (typeof window !== 'undefined') {
  // jsdom exposes touch handlers (`ontouchstart` …) on window, Document and HTMLElement, so capability
  // checks like @universe/environment's `isTouchable` would read every suite as a touch device.
  for (const target of [window, Document.prototype, HTMLElement.prototype, SVGElement.prototype]) {
    for (const handler of ['ontouchstart', 'ontouchend', 'ontouchmove', 'ontouchcancel']) {
      delete target[handler]
    }
  }

  // jsdom has no AnimationEvent but does support `style.WebkitAnimation`, so without this React DOM
  // binds onAnimationEnd to `webkitAnimationEnd` and never sees a dispatched `animationend`.
  if (typeof window.AnimationEvent === 'undefined') {
    class AnimationEventPolyfill extends Event {
      constructor(type, init = {}) {
        super(type, init)
        this.animationName = init.animationName ?? ''
        this.elapsedTime = init.elapsedTime ?? 0
        this.pseudoElement = init.pseudoElement ?? ''
      }
    }
    window.AnimationEvent = AnimationEventPolyfill
    globalThis.AnimationEvent = AnimationEventPolyfill
  }
}
