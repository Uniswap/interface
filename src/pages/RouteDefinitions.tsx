import { useInfoExplorePageEnabled } from 'featureFlags/flags/infoExplore'
import { useInfoPoolPageEnabled } from 'featureFlags/flags/infoPoolPage'
import { useAtom } from 'jotai'
import { lazy, ReactNode, useMemo } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { shouldDisableNFTRoutesAtom } from 'state/application/atoms'
import { isBrowserRouterEnabled } from 'utils/env'

// High-traffic pages (index and /swap) should not be lazy-loaded.
import Swap from './Swap'

const Explore = lazy(() => import('pages/Explore'))
const RedirectExplore = lazy(() => import('pages/Explore/redirects'))
const NotFound = lazy(() => import('pages/NotFound'))
const TokenDetails = lazy(() => import('pages/TokenDetails'))
interface RouterConfig {
  browserRouterEnabled?: boolean
  hash?: string
  infoExplorePageEnabled?: boolean
  infoPoolPageEnabled?: boolean
  shouldDisableNFTRoutes?: boolean
}

/**
 * Convenience hook which organizes the router configuration into a single object.
 */
export function useRouterConfig(): RouterConfig {
  const browserRouterEnabled = isBrowserRouterEnabled()
  const { hash } = useLocation()
  const infoPoolPageEnabled = useInfoPoolPageEnabled()
  const infoExplorePageEnabled = useInfoExplorePageEnabled()
  const [shouldDisableNFTRoutes] = useAtom(shouldDisableNFTRoutesAtom)
  return useMemo(
    () => ({
      browserRouterEnabled,
      hash,
      infoExplorePageEnabled,
      infoPoolPageEnabled,
      shouldDisableNFTRoutes: Boolean(shouldDisableNFTRoutes),
    }),
    [browserRouterEnabled, hash, infoExplorePageEnabled, infoPoolPageEnabled, shouldDisableNFTRoutes]
  )
}

export interface RouteDefinition {
  path: string
  nestedPaths: string[]
  enabled: (args: RouterConfig) => boolean
  getElement: (args: RouterConfig) => ReactNode
}

// Assigns the defaults to the route definition.
function createRouteDefinition(route: Partial<RouteDefinition>): RouteDefinition {
  return {
    getElement: () => null,
    enabled: () => true,
    path: '/',
    nestedPaths: [],
    // overwrite the defaults
    ...route,
  }
}

export const routes: RouteDefinition[] = [
  // createRouteDefinition({
  //   path: '/',
  //   getElement: (args) => {
  //     return args.browserRouterEnabled && args.hash ? <Navigate to={args.hash.replace('#', '')} replace /> : <Landing />
  //   },
  // }),

  createRouteDefinition({
    path: '/tokens/:chainName',
    getElement: (args) => {
      return args.infoExplorePageEnabled ? <RedirectExplore /> : <Explore />
    },
  }),
  createRouteDefinition({
    path: '/tokens/:chainName/:tokenAddress',
    getElement: (args) => {
      return args.infoExplorePageEnabled ? <RedirectExplore /> : <TokenDetails />
    },
  }),
  createRouteDefinition({
    path: '/send',
    getElement: () => <Navigate to={{ ...location, pathname: '/swap' }} replace />,
  }),
  createRouteDefinition({ path: '/swap', getElement: () => <Swap /> }),
  createRouteDefinition({ path: '*', getElement: () => <Navigate to="/swap" replace /> }),
  createRouteDefinition({ path: '/not-found', getElement: () => <NotFound /> }),
]
