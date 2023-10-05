import { useInfoPoolPageEnabled } from 'featureFlags/flags/infoPoolPage'
import { useAtom } from 'jotai'
import { lazy, ReactNode, Suspense, useMemo } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { shouldDisableNFTRoutesAtom } from 'state/application/atoms'
import { SpinnerSVG } from 'theme/components'
import { isBrowserRouterEnabled } from 'utils/env'

// High-traffic pages (index and /swap) should not be lazy-loaded.
import Landing from './Landing'
import Swap from './Swap'

const NftExplore = lazy(() => import('nft/pages/explore'))
const Collection = lazy(() => import('nft/pages/collection'))
const Profile = lazy(() => import('nft/pages/profile'))
const Asset = lazy(() => import('nft/pages/asset/Asset'))
const AddLiquidity = lazy(() => import('pages/AddLiquidity'))
const RedirectDuplicateTokenIds = lazy(() => import('pages/AddLiquidity/redirects'))
const RedirectDuplicateTokenIdsV2 = lazy(() => import('pages/AddLiquidityV2/redirects'))
const MigrateV2 = lazy(() => import('pages/MigrateV2'))
const MigrateV2Pair = lazy(() => import('pages/MigrateV2/MigrateV2Pair'))
const NotFound = lazy(() => import('pages/NotFound'))
const Pool = lazy(() => import('pages/Pool'))
const PositionPage = lazy(() => import('pages/Pool/PositionPage'))
const PoolV2 = lazy(() => import('pages/Pool/v2'))
const PoolDetails = lazy(() => import('pages/PoolDetails'))
const PoolFinder = lazy(() => import('pages/PoolFinder'))
const RemoveLiquidity = lazy(() => import('pages/RemoveLiquidity'))
const RemoveLiquidityV3 = lazy(() => import('pages/RemoveLiquidity/V3'))
const TokenDetails = lazy(() => import('pages/TokenDetails'))
const Tokens = lazy(() => import('pages/Tokens'))
const Vote = lazy(() => import('pages/Vote'))

// this is the same svg defined in assets/images/blue-loader.svg
// it is defined here because the remote asset may not have had time to load when this file is executing
const LazyLoadSpinner = () => (
  <SpinnerSVG width="94" height="94" viewBox="0 0 94 94" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M92 47C92 22.1472 71.8528 2 47 2C22.1472 2 2 22.1472 2 47C2 71.8528 22.1472 92 47 92"
      stroke="#2172E5"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </SpinnerSVG>
)

interface RouterConfig {
  browserRouterEnabled?: boolean
  hash?: string
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
  const [shouldDisableNFTRoutes] = useAtom(shouldDisableNFTRoutesAtom)
  return useMemo(
    () => ({
      browserRouterEnabled,
      hash,
      infoPoolPageEnabled,
      shouldDisableNFTRoutes: Boolean(shouldDisableNFTRoutes),
    }),
    [browserRouterEnabled, hash, infoPoolPageEnabled, shouldDisableNFTRoutes]
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
  createRouteDefinition({
    path: '/',
    getElement: (args) => {
      return args.browserRouterEnabled && args.hash ? <Navigate to={args.hash.replace('#', '')} replace /> : <Landing />
    },
  }),
  createRouteDefinition({
    path: '/tokens',
    nestedPaths: [':chainName'],
    getElement: () => <Tokens />,
  }),
  createRouteDefinition({ path: '/tokens/:chainName/:tokenAddress', getElement: () => <TokenDetails /> }),
  createRouteDefinition({
    path: '/pools/:chainName/:poolAddress',
    getElement: () => <PoolDetails />,
    enabled: (args) => Boolean(args.infoPoolPageEnabled),
  }),
  createRouteDefinition({
    path: '/vote/*',
    getElement: () => (
      <Suspense fallback={<LazyLoadSpinner />}>
        <Vote />
      </Suspense>
    ),
  }),
  createRouteDefinition({
    path: '/create-proposal',
    getElement: () => <Navigate to="/vote/create-proposal" replace />,
  }),
  createRouteDefinition({
    path: '/send',
    getElement: () => <Navigate to={{ ...location, pathname: '/swap' }} replace />,
  }),
  createRouteDefinition({ path: '/swap', getElement: () => <Swap /> }),
  createRouteDefinition({ path: '/pool/v2/find', getElement: () => <PoolFinder /> }),
  createRouteDefinition({ path: '/pool/v2', getElement: () => <PoolV2 /> }),
  createRouteDefinition({ path: '/pool', getElement: () => <Pool /> }),
  createRouteDefinition({ path: '/pool/:tokenId', getElement: () => <PositionPage /> }),
  createRouteDefinition({ path: '/pools/v2/find', getElement: () => <PoolFinder /> }),
  createRouteDefinition({ path: '/pools/v2', getElement: () => <PoolV2 /> }),
  createRouteDefinition({ path: '/pools', getElement: () => <Pool /> }),
  createRouteDefinition({ path: '/pools/:tokenId', getElement: () => <PositionPage /> }),
  createRouteDefinition({
    path: '/add/v2',
    nestedPaths: [':currencyIdA', ':currencyIdA/:currencyIdB'],
    getElement: () => <RedirectDuplicateTokenIdsV2 />,
  }),
  createRouteDefinition({
    path: '/add',
    nestedPaths: [':currencyIdA', ':currencyIdA/:currencyIdB', ':currencyIdA/:currencyIdB/:feeAmount'],
    getElement: () => <RedirectDuplicateTokenIds />,
  }),

  createRouteDefinition({
    path: '/increase',
    nestedPaths: [
      ':currencyIdA',
      ':currencyIdA/:currencyIdB',
      ':currencyIdA/:currencyIdB/:feeAmount',
      ':currencyIdA/:currencyIdB/:feeAmount/:tokenId',
    ],
    getElement: () => <AddLiquidity />,
  }),
  createRouteDefinition({ path: '/remove/v2/:currencyIdA/:currencyIdB', getElement: () => <RemoveLiquidity /> }),
  createRouteDefinition({ path: '/remove/:tokenId', getElement: () => <RemoveLiquidityV3 /> }),
  createRouteDefinition({ path: '/migrate/v2', getElement: () => <MigrateV2 /> }),
  createRouteDefinition({ path: '/migrate/v2/:address', getElement: () => <MigrateV2Pair /> }),
  createRouteDefinition({
    path: '/nfts',
    getElement: () => (
      <Suspense fallback={null}>
        <NftExplore />
      </Suspense>
    ),
    enabled: (args) => !args.shouldDisableNFTRoutes,
  }),
  createRouteDefinition({
    path: '/nfts/asset/:contractAddress/:tokenId',
    getElement: () => (
      <Suspense fallback={null}>
        <Asset />
      </Suspense>
    ),
    enabled: (args) => !args.shouldDisableNFTRoutes,
  }),
  createRouteDefinition({
    path: '/nfts/profile',
    getElement: () => (
      <Suspense fallback={null}>
        <Profile />
      </Suspense>
    ),
    enabled: (args) => !args.shouldDisableNFTRoutes,
  }),
  createRouteDefinition({
    path: '/nfts/collection/:contractAddress',
    getElement: () => (
      <Suspense fallback={null}>
        <Collection />
      </Suspense>
    ),
    enabled: (args) => !args.shouldDisableNFTRoutes,
  }),
  createRouteDefinition({
    path: '/nfts/collection/:contractAddress/activity',
    getElement: () => (
      <Suspense fallback={null}>
        <Collection />
      </Suspense>
    ),
    enabled: (args) => !args.shouldDisableNFTRoutes,
  }),
  createRouteDefinition({ path: '*', getElement: () => <Navigate to="/not-found" replace /> }),
  createRouteDefinition({ path: '/not-found', getElement: () => <NotFound /> }),
]
