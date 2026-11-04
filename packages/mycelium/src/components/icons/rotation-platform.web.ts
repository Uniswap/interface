/**
 * Web leg of the rotation-wrapper icons' two platform-resolved pieces: how RTL
 * is read, and whether the rotate animates through CSS.
 *
 * A per-icon `RotatableChevron.native.tsx` twin would never be resolved — the
 * `./icons/*` subpath maps deep icon imports to exact `.tsx` files and bundlers
 * take an exports target literally. So the split rides `rotation-platform`'s
 * EXTENSIONLESS internal import instead, the same mechanism the generated
 * icons' `factories/svg-elements` host shim uses: web resolvers load this leg
 * (directly, or through the base leg's re-export), Metro loads
 * `rotation-platform.native.ts`. Keeping `react-native` out of
 * this leg is what lets it stay an optional peer.
 *
 * Export set pinned against the native leg by `__tests__/platform-legs.test.tsx`.
 */

/** Document direction is the web RTL signal; guarded so an SSR pass reads LTR instead of throwing. */
export function isRTL(): boolean {
  return typeof document !== 'undefined' && document.documentElement.dir === 'rtl'
}

/**
 * Transform-only transition, deliberately on the legacy Tamagui `fast` preset's
 * 150ms timing. A className rather than a `transition` style key: the style key
 * is inert on device and the compat leg would dev-warn it as a dropped prop on
 * every render. Same shape as `trigger-button-compat`'s chevron class.
 */
export const ROTATE_TRANSITION_CLASS = 'transition-transform duration-150 ease-in-out'
