/**
 * Web portal primitive: a TRUE document-level portal.
 *
 * `createPortal(..., document.body)` relocates the subtree in the DOM, not
 * just in the React tree, so the overlay is a child of `<body>` and is
 * subject to no ancestor's stacking context, clip, `overflow`, `transform`,
 * `filter` or `contain`. That property is the whole reason this primitive
 * exists: the call sites moving onto it are overlays that must escape a
 * transformed ancestor (`RecentlyConnectedModal` says so in a comment at its
 * portal), and a portal HOST rendered inside the React tree (Tamagui's own
 * `PortalHost`, a `<div style="display:contents">`, or a native
 * `PortalHost`) cannot do that.
 *
 * The mechanism, the wrapper element and the z-index arithmetic are all
 * ported from `@tamagui/portal`'s web `Portal`, which was already doing
 * exactly this, so z-order is preserved by construction rather than by
 * coincidence. Three details carry that parity and must not drift:
 *
 * - `position: fixed; inset: 0` makes the wrapper a full-window layer, so
 *   children position against the viewport rather than the portal's DOM
 *   parent.
 * - `contain: strict` isolates the wrapper's layout/paint, matching what the
 *   overlays were already rendering inside.
 * - `pointer-events: none` keeps the full-window layer from swallowing clicks
 *   meant for the page; overlay content re-enables its own.
 */
import { createContext, type CSSProperties, type JSX, useContext, useEffect, useId, useMemo } from 'react'
import { createPortal } from 'react-dom'
import type { PortalProps, PortalProviderProps } from './PortalProps'
import { createPortalStackRegistry, portalJoinsStack, type PortalStackRegistry, resolvePortalZIndex } from './stack'

/**
 * Portals work without a `PortalProvider` (Tamagui's web Portal needed no
 * provider either), so a provider-less tree shares this scope rather than
 * throwing.
 *
 * The trade this makes, deliberately, for Tamagui parity: it is module-level
 * mutable state, so every provider-less portal in the process stacks against
 * every other one, process-globally rather than per mount. Tamagui's registry
 * was module-level in exactly the same way. Mount a `PortalProvider` to get an
 * isolated scope, which is what `apps/web` does at its root and what the tests
 * rely on.
 */
const defaultStackRegistry = createPortalStackRegistry()

const PortalStackContext = createContext<PortalStackRegistry>(defaultStackRegistry)

const PORTAL_WRAPPER_BASE_STYLE = {
  position: 'fixed',
  inset: 0,
  contain: 'strict',
  pointerEvents: 'none',
} as const satisfies CSSProperties

/**
 * Root provider for the portal layer. On web, portals target `document.body`
 * directly, so the provider mounts no host element; what it establishes is
 * the z-index stacking scope portals register into, which is the part of
 * Tamagui's `PortalProvider` + `ZIndexStackContext` pair that actually
 * governed ordering.
 */
export function PortalProvider({ children }: PortalProviderProps): JSX.Element {
  const registry = useMemo(() => createPortalStackRegistry(), [])

  return <PortalStackContext.Provider value={registry}>{children}</PortalStackContext.Provider>
}

export function Portal({ children, zIndex, stackZIndex }: PortalProps): JSX.Element | null {
  const registry = useContext(PortalStackContext)
  const key = useId()

  // Resolved during render, exactly as Tamagui did, so a portal mounting
  // later reads the z-indexes its already-mounted siblings registered.
  const resolvedZIndex = useMemo(
    () => resolvePortalZIndex(registry, { zIndex, stackZIndex, selfKey: key }),
    [registry, zIndex, stackZIndex, key],
  )

  // Only a portal that actually stacked publishes a ceiling; see `portalJoinsStack`.
  const joinsStack = portalJoinsStack({ zIndex, stackZIndex })

  useEffect(() => {
    if (!joinsStack) {
      return undefined
    }
    registry.register(key, resolvedZIndex)
    return () => {
      registry.unregister(key)
    }
  }, [registry, key, resolvedZIndex, joinsStack])

  const wrapperStyle = useMemo<CSSProperties>(
    () => ({ ...PORTAL_WRAPPER_BASE_STYLE, zIndex: resolvedZIndex }),
    [resolvedZIndex],
  )

  // Server render (and any DOM-less environment) has no body to portal into.
  if (typeof document === 'undefined') {
    return null
  }

  return createPortal(<span style={wrapperStyle}>{children}</span>, document.body)
}
