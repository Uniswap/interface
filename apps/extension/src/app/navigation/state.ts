import { useEffect, useState } from 'react'
import { createHashRouter, Location, NavigationType } from 'react-router'

interface RouterState {
  historyAction: NavigationType
  location: Location
}

/**
 * Note this file is separate from SidebarApp on purpose!
 *
 * Because the router imports all the top-level pages, you can't import it from
 * below those pages without causing circular imports.
 *
 * Circular imports break many things - HMR, bundle splitting, tree shaking,
 * etc.
 *
 * So instead we use this file as a way to "push" the router into an import that
 * is safe from circularity.
 */

type RouterStateListener = (state: RouterState) => void

let state: RouterState | null = null

const listeners = new Set<RouterStateListener>()

export function setRouterState(next: RouterState): void {
  state = next
  listeners.forEach((l) => l(next))
}

function subscribeToRouterState(listener: RouterStateListener): () => void {
  listeners.add(listener)

  if (state) {
    listener(state)
  }

  return () => {
    listeners.delete(listener)
  }
}

export function useRouterState(): RouterState | null {
  const [val, setVal] = useState(state)

  useEffect(() => {
    return subscribeToRouterState(setVal)
  }, [])

  return val
}

// as far as i can tell, react-router doesn't give us this type so have to work around
type Router = ReturnType<typeof createHashRouter>

let router: Router | null = null

export function setRouter(next: Router): void {
  router = next
}

export function getRouter(): Router {
  if (!router) {
    throw new Error('Invalid call to `getRouter` before the router was initialized')
  }
  return router
}

type RouterNavigate = Router['navigate']
type RouterNavigateArgs = Parameters<RouterNavigate>

// this is a navigate that doesn't need any useNavigate() hook, which in react router has performance issues:
// https://github.com/remix-run/react-router/issues/7634#issuecomment-1306650156
// note: useNavigation().navigate() returns void, so making this match that function for easier swapping out
export const navigate = (to: RouterNavigateArgs[0] | number, opts?: RouterNavigateArgs[1]): void => {
  if (typeof to === 'number') {
    // biome-ignore lint/complexity/noVoid: Router navigation returns Promise<void> requiring explicit void handling
    void getRouter().navigate(to)
    return
  }
  // biome-ignore lint/complexity/noVoid: Router navigation returns Promise<void> requiring explicit void handling
  void getRouter().navigate(to, opts)
}
