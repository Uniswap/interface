import type { ReactNode } from 'react'

/**
 * Public prop surface of the portal primitive, shared by the platformless
 * base leg and the `.web` / `.native` legs so all three expose one contract.
 *
 * The prop surface is identical across legs; the RENDERING is not, in three
 * respects worth knowing before you rely on it. The web leg keeps children in
 * the React tree (`createPortal` moves them only in the DOM), so React context
 * provided between the provider and the call site still reaches them. The
 * native leg has no such mechanism: it re-parents children into the
 * PROVIDER's subtree, so context provided below the provider is NOT visible to
 * portalled children there. `Portal.native.test.tsx` pins that divergence so it
 * fails loudly rather than being discovered in an app.
 *
 * The provider is also required on native and optional on web: a web `Portal`
 * with no `PortalProvider` above it falls back to a module-level stacking scope
 * and renders, while the native leg throws. A component authored and tested on
 * web therefore needs a `PortalProvider` mounted before it renders on native.
 *
 * Pointer events are the third divergence, and the only one of them that
 * requires work at the call site. The web wrapper is `pointer-events: none` so
 * the full-window layer cannot swallow clicks meant for the page, and that
 * value inherits, so a child stays unclickable until it sets its own
 * `pointerEvents: 'auto'` (`RecentlyConnectedModal` does exactly that). The
 * native wrapper is `box-none` instead, which leaves the layer itself
 * untouchable while keeping its children touchable, so native children need no
 * such opt-in.
 */
export interface PortalProps {
  children?: ReactNode
  /** Explicit stacking value for the full-window portal wrapper. Takes precedence over `stackZIndex`. */
  zIndex?: number
  /**
   * Lifts this portal above sibling portals, mirroring how call sites passed
   * a numeric `stackZIndex` to Tamagui's Portal. Portals without either prop
   * stack by mount order. See `resolvePortalZIndex` for the exact arithmetic.
   */
  stackZIndex?: number
}

export interface PortalProviderProps {
  children?: ReactNode
}

/** testID of the overlay layer the native provider renders (targetable from e2e flows). */
export const PORTAL_LAYER_TEST_ID = 'portal-layer'
