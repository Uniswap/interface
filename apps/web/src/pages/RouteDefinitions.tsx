import { t } from 'i18n'
import { useAtom } from 'jotai'
import { lazy, ReactNode, Suspense, useMemo } from 'react'
import { matchPath, Navigate, useLocation } from 'react-router-dom'
import { shouldDisableNFTRoutesAtom } from 'state/application/atoms'
import { SpinnerSVG } from 'theme/components'
import { isBrowserRouterEnabled } from 'utils/env'

import { getAddLiquidityPageTitle, getPositionPageDescription, getPositionPageTitle } from 'pages/getPositionPageTitle'
import { getExploreDescription, getExploreTitle } from './getExploreTitle'
// High-traffic pages (index and /swap) should not be lazy-loaded.
import Landing from './Landing'
import Swap from './Swap'

const NftExplore = lazy(() => import('nft/pages/explore'))
const Collection = lazy(() => import('nft/pages/collection'))
const Profile = lazy(() => import('nft/pages/profile'))
const Asset = lazy(() => import('nft/pages/asset/Asset'))
const AddLiquidityWithTokenRedirects = lazy(() => import('pages/AddLiquidity/redirects'))
const AddLiquidityV2WithTokenRedirects = lazy(() => import('pages/AddLiquidityV2/redirects'))
const RedirectExplore = lazy(() => import('pages/Explore/redirects'))
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
  shouldDisableNFTRoutes?: boolean
}

/**
 * Convenience hook which organizes the router configuration into a single object.
 */
export function useRouterConfig(): RouterConfig {
  const browserRouterEnabled = isBrowserRouterEnabled()
  const { hash } = useLocation()
  const [shouldDisableNFTRoutes] = useAtom(shouldDisableNFTRoutesAtom)
  return useMemo(
    () => ({
      browserRouterEnabled,
      hash,
      shouldDisableNFTRoutes: Boolean(shouldDisableNFTRoutes),
    }),
    [browserRouterEnabled, hash, shouldDisableNFTRoutes]
  )
}

// SEO titles and descriptions sourced from https://docs.google.com/spreadsheets/d/1_6vSxGgmsx6QGEZ4mdHppv1VkuiJEro3Y_IopxUHGB4/edit#gid=0
// getTitle and getDescription are used as static metatags for SEO. Dynamic metatags should be set in the page component itself
const StaticTitlesAndDescriptions = {
  UniswapTitle: t`Uniswap | Trade crypto and NFTs safely on the top DeFi platform`,
  SwapTitle: t`Buy, sell & trade Ethereum and other top tokens on Uniswap`,
  SwapDescription: t`Swapping made simple. Buy and sell crypto on Ethereum, Base, Arbitrum, Polygon, and more. Trusted by millions.`,
  DetailsPageBaseTitle: t`Buy and sell on Uniswap`,
  TDPDescription: t`Buy and sell on Uniswap. Real-time prices, charts, transaction data, and more.`,
  PDPDescription: t`Trade tokens and provide liquidity. Real-time prices, charts, transaction data, and more.`,
  NFTTitle: t`Explore NFTs on Uniswap`,
  MigrateTitle: t`Migrate v2 pool liquidity to Uniswap v3`,
  MigrateDescription: t`Easily remove your liquidity from Uniswap v2 and deposit into Uniswap v3.`,
  AddLiquidityDescription: t`Earn fees when others swap on Uniswap by adding tokens to liquidity pools.`,
}

export interface RouteDefinition {
  path: string
  nestedPaths: string[]
  getTitle: (path?: string) => string
  getDescription: (path?: string) => string
  enabled: (args: RouterConfig) => boolean
  getElement: (args: RouterConfig) => ReactNode
}

// Assigns the defaults to the route definition.
function createRouteDefinition(route: Partial<RouteDefinition>): RouteDefinition {
  return {
    getElement: () => null,
    getTitle: () => StaticTitlesAndDescriptions.UniswapTitle,
    getDescription: () => StaticTitlesAndDescriptions.SwapDescription,
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
    getTitle: () => StaticTitlesAndDescriptions.UniswapTitle,
    getDescription: () => StaticTitlesAndDescriptions.SwapDescription,
    getElement: (args) => {
      return args.browserRouterEnabled && args.hash ? <Navigate to={args.hash.replace('#', '')} replace /> : <Landing />
    },
  }),
  createRouteDefinition({
    path: '/explore',
    getTitle: getExploreTitle,
    getDescription: getExploreDescription,
    nestedPaths: [':tab', ':chainName', ':tab/:chainName'],
    getElement: () => <RedirectExplore />,
  }),
  createRouteDefinition({
    path: '/explore/tokens/:chainName/:tokenAddress',
    getTitle: () => t`Buy and sell on Uniswap`,
    getDescription: () => StaticTitlesAndDescriptions.TDPDescription,
    getElement: () => <TokenDetails />,
  }),
  createRouteDefinition({
    path: '/tokens',
    getTitle: getExploreTitle,
    getDescription: getExploreDescription,
    getElement: () => <Navigate to="/explore/tokens" replace />,
  }),
  createRouteDefinition({
    path: '/tokens/:chainName',
    getTitle: getExploreTitle,
    getDescription: getExploreDescription,
    getElement: () => <RedirectExplore />,
  }),
  createRouteDefinition({
    path: '/tokens/:chainName/:tokenAddress',
    getTitle: () => StaticTitlesAndDescriptions.DetailsPageBaseTitle,
    getDescription: () => StaticTitlesAndDescriptions.TDPDescription,
    getElement: () => <RedirectExplore />,
  }),
  createRouteDefinition({
    path: '/explore/pools/:chainName/:poolAddress',
    getTitle: () => StaticTitlesAndDescriptions.DetailsPageBaseTitle,
    getDescription: () => StaticTitlesAndDescriptions.PDPDescription,
    getElement: () => (
      <Suspense fallback={null}>
        <PoolDetails />
      </Suspense>
    ),
  }),
  createRouteDefinition({
    path: '/vote/*',
    getTitle: () => t`Vote on governance proposals on Uniswap`,
    getDescription: () =>
      t`UNI tokens represent voting shares in Uniswap governance. You can vote on each proposal yourself or delegate your votes to a third party.`,
    getElement: () => (
      <Suspense fallback={<LazyLoadSpinner />}>
        <Vote />
      </Suspense>
    ),
  }),
  createRouteDefinition({
    path: '/create-proposal',
    getTitle: () => t`Create a new governance proposal on Uniswap`,
    getDescription: () =>
      t`Create a new governance proposal to be voted on by UNI holders. UNI tokens represent voting shares in Uniswap governance.`,
    getElement: () => <Navigate to="/vote/create-proposal" replace />,
  }),
  createRouteDefinition({
    path: '/send',
    getElement: () => <Swap />,
    getTitle: () => t`Send tokens on Uniswap`,
  }),
  createRouteDefinition({
    path: '/limits',
    getElement: () => <Navigate to="/limit" replace />,
    getTitle: () => t`Place limit orders on Uniswap`,
  }),
  createRouteDefinition({
    path: '/limit',
    getElement: () => <Swap />,
    getTitle: () => t`Place limit orders on Uniswap`,
  }),
  createRouteDefinition({
    path: '/swap',
    getElement: () => <Swap />,
    getTitle: () => StaticTitlesAndDescriptions.SwapTitle,
  }),
  createRouteDefinition({
    path: '/pool/v2/find',
    getElement: () => <PoolFinder />,
    getTitle: () => t`Import top liquidity pools (v2) on Uniswap`,
    getDescription: () => t`Use this import tool to find v2 pools that don't automatically appear in the interface.`,
  }),
  createRouteDefinition({
    path: '/pool/v2',
    getElement: () => <PoolV2 />,
    getTitle: getPositionPageTitle,
    getDescription: getPositionPageDescription,
  }),
  createRouteDefinition({
    path: '/pool',
    getElement: () => <Pool />,
    getTitle: getPositionPageTitle,
    getDescription: getPositionPageDescription,
  }),
  createRouteDefinition({
    path: '/pool/:tokenId',
    getElement: () => <PositionPage />,
    getTitle: getPositionPageTitle,
    getDescription: getPositionPageDescription,
  }),
  createRouteDefinition({
    path: '/pools/v2/find',
    getElement: () => <PoolFinder />,
    getTitle: () => t`Import top liquidity pools (v2) on Uniswap`,
    getDescription: () => t`Use this import tool to find v2 pools that don't automatically appear in the interface.`,
  }),
  createRouteDefinition({
    path: '/pools/v2',
    getElement: () => <PoolV2 />,
    getTitle: getPositionPageTitle,
    getDescription: getPositionPageDescription,
  }),
  createRouteDefinition({
    path: '/pools',
    getElement: () => <Pool />,
    getTitle: getPositionPageTitle,
    getDescription: getPositionPageDescription,
  }),
  createRouteDefinition({
    path: '/pools/:tokenId',
    getElement: () => <PositionPage />,
    getTitle: getPositionPageTitle,
    getDescription: getPositionPageDescription,
  }),
  createRouteDefinition({
    path: '/add/v2',
    nestedPaths: [':currencyIdA', ':currencyIdA/:currencyIdB'],
    getElement: () => <AddLiquidityV2WithTokenRedirects />,
    getTitle: getAddLiquidityPageTitle,
    getDescription: () => StaticTitlesAndDescriptions.AddLiquidityDescription,
  }),
  createRouteDefinition({
    path: '/add',
    nestedPaths: [
      ':currencyIdA',
      ':currencyIdA/:currencyIdB',
      ':currencyIdA/:currencyIdB/:feeAmount',
      ':currencyIdA/:currencyIdB/:feeAmount/:tokenId',
    ],
    getElement: () => <AddLiquidityWithTokenRedirects />,
    getTitle: getAddLiquidityPageTitle,
    getDescription: () => StaticTitlesAndDescriptions.AddLiquidityDescription,
  }),
  createRouteDefinition({
    path: '/remove/v2/:currencyIdA/:currencyIdB',
    getElement: () => <RemoveLiquidity />,
    getTitle: () => t`Remove pool liquidity (v2) on Uniswap`,
    getDescription: () => t`Remove your tokens from v2 liquidity pools.`,
  }),
  createRouteDefinition({
    path: '/remove/:tokenId',
    getElement: () => <RemoveLiquidityV3 />,
    getTitle: () => t`Remove pool liquidity on Uniswap`,
    getDescription: () => t`Remove your tokens from v3 liquidity pools.`,
  }),
  createRouteDefinition({
    path: '/migrate/v2',
    getElement: () => <MigrateV2 />,
    getTitle: () => StaticTitlesAndDescriptions.MigrateTitle,
    getDescription: () => StaticTitlesAndDescriptions.MigrateDescription,
  }),
  createRouteDefinition({
    path: '/migrate/v2/:address',
    getElement: () => <MigrateV2Pair />,
    getTitle: () => StaticTitlesAndDescriptions.MigrateTitle,
    getDescription: () => StaticTitlesAndDescriptions.MigrateDescription,
  }),
  createRouteDefinition({
    path: '/nfts',
    getElement: () => (
      <Suspense fallback={null}>
        <NftExplore />
      </Suspense>
    ),
    enabled: (args) => !args.shouldDisableNFTRoutes,
    getTitle: () => t`Explore and buy NFTs across top marketplaces on Uniswap`,
    getDescription: () =>
      t`Better prices. More listings. Buy, sell, and trade NFTs across top marketplaces like OpenSea. Explore trending collections.`,
  }),
  createRouteDefinition({
    path: '/nfts/asset/:contractAddress/:tokenId',
    getElement: () => (
      <Suspense fallback={null}>
        <Asset />
      </Suspense>
    ),
    enabled: (args) => !args.shouldDisableNFTRoutes,
    getTitle: () => StaticTitlesAndDescriptions.NFTTitle,
  }),
  createRouteDefinition({
    path: '/nfts/profile',
    getElement: () => (
      <Suspense fallback={null}>
        <Profile />
      </Suspense>
    ),
    enabled: (args) => !args.shouldDisableNFTRoutes,
    getTitle: () => StaticTitlesAndDescriptions.NFTTitle,
    getDescription: () =>
      t`Manage your NFT collection. View traits, trading activity, descriptions, and other details on your NFTs.`,
  }),
  createRouteDefinition({
    path: '/nfts/collection/:contractAddress',
    getElement: () => (
      <Suspense fallback={null}>
        <Collection />
      </Suspense>
    ),
    enabled: (args) => !args.shouldDisableNFTRoutes,
    getTitle: () => StaticTitlesAndDescriptions.NFTTitle,
  }),
  createRouteDefinition({
    path: '/nfts/collection/:contractAddress/activity',
    getElement: () => (
      <Suspense fallback={null}>
        <Collection />
      </Suspense>
    ),
    enabled: (args) => !args.shouldDisableNFTRoutes,
    getTitle: () => StaticTitlesAndDescriptions.NFTTitle,
  }),
  createRouteDefinition({ path: '*', getElement: () => <Navigate to="/not-found" replace /> }),
  createRouteDefinition({ path: '/not-found', getElement: () => <NotFound /> }),
]

export const findRouteByPath = (pathname: string) => {
  for (const route of routes) {
    const match = matchPath(route.path, pathname)
    if (match) {
      return route
    }
    const subPaths = route.nestedPaths.map((nestedPath) => `${route.path}/${nestedPath}`)
    for (const subPath of subPaths) {
      const match = matchPath(subPath, pathname)
      if (match) {
        return route
      }
    }
  }
  return undefined
}
