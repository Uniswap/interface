/**
 * Native portal primitive, on `@rn-primitives/portal` (`PrimitivePortal` into
 * a named `PortalHost`), the same mechanism the legacy `ui/src` native portal
 * used. Delegating rather than hand-rolling a host keeps one native portal
 * mechanism in the repo.
 *
 * What this leg adds over the primitive: the resolved z-index (shared with the
 * web leg through `stack.ts`) and a per-provider scope. `@rn-primitives/portal`'s registry is module-global
 * keyed by host name, so `PortalProvider` mints its own host name from `useId`
 * and hands it down with the stack registry; two providers therefore cannot see
 * each other's portals, matching the web leg's per-provider stacking scope.
 *
 * Each entry is wrapped in an absolutely-filled `box-none` `View` carrying the
 * resolved z-index: full-screen overlay placement with touch pass-through.
 *
 * KNOWN DIVERGENCE FROM THE WEB LEG, pinned by a test rather than only
 * described here. Children are re-parented into the host's subtree, so they are
 * rendered under the PROVIDER's context, not the call site's. React context
 * provided between `PortalProvider` and a `Portal` is therefore invisible to
 * that portal's children on native, while on web it flows normally because
 * `createPortal` relocates the subtree in the DOM only. There is no clean fix
 * inside this primitive: React Native has no DOM to relocate into, so a
 * host-based portal necessarily renders at the host. Anything a native portal's
 * children need must be passed as props or provided above the
 * `PortalProvider`.
 */
import { Portal as PrimitivePortal, PortalHost } from '@rn-primitives/portal'
import { createContext, type JSX, useContext, useEffect, useId, useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { PORTAL_LAYER_TEST_ID, type PortalProps, type PortalProviderProps } from './PortalProps'
import {
  createPortalStackRegistry,
  PORTAL_DEFAULT_Z_INDEX,
  portalJoinsStack,
  type PortalStackRegistry,
  resolvePortalZIndex,
} from './stack'

interface PortalScope {
  /** `@rn-primitives/portal` host name; per-provider, so provider scopes stay isolated. */
  hostName: string
  stack: PortalStackRegistry
}

const PortalScopeContext = createContext<PortalScope | null>(null)

/**
 * Mounts the overlay layer every `Portal` below it teleports into. Mount once
 * at the app root, after the app's own content.
 */
export function PortalProvider({ children }: PortalProviderProps): JSX.Element {
  const hostName = useId()
  const stack = useMemo(() => createPortalStackRegistry(), [])
  const scope = useMemo<PortalScope>(() => ({ hostName, stack }), [hostName, stack])

  return (
    <PortalScopeContext.Provider value={scope}>
      {children}
      <View pointerEvents="box-none" style={StyleSheet.absoluteFill} testID={PORTAL_LAYER_TEST_ID}>
        <PortalHost name={hostName} />
      </View>
    </PortalScopeContext.Provider>
  )
}

export function Portal({ children, zIndex, stackZIndex }: PortalProps): JSX.Element | null {
  const scope = useContext(PortalScopeContext)
  const key = useId()

  const resolvedZIndex = useMemo(
    () => (scope ? resolvePortalZIndex(scope.stack, { zIndex, stackZIndex, selfKey: key }) : PORTAL_DEFAULT_Z_INDEX),
    [scope, zIndex, stackZIndex, key],
  )

  // Only a portal that actually stacked publishes a ceiling; see `portalJoinsStack`.
  const joinsStack = portalJoinsStack({ zIndex, stackZIndex })

  useEffect(() => {
    if (!scope || !joinsStack) {
      return undefined
    }
    scope.stack.register(key, resolvedZIndex)
    return () => {
      scope.stack.unregister(key)
    }
  }, [scope, key, resolvedZIndex, joinsStack])

  if (!scope) {
    throw new Error('Portal must be rendered below a PortalProvider (@universe/mycelium/portal).')
  }

  // Renders nothing in place: the primitive teleports the wrapper to the host.
  return (
    <PrimitivePortal hostName={scope.hostName} name={key}>
      <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, { zIndex: resolvedZIndex }]}>
        {children}
      </View>
    </PrimitivePortal>
  )
}
