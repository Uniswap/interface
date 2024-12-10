import { useAtom } from 'jotai'
import { getExploreDescription, getExploreTitle } from 'pages/getExploreTitle'
import { getAddLiquidityPageTitle, getPositionPageDescription, getPositionPageTitle } from 'pages/getPositionPageTitle'
import { ReactNode, Suspense, lazy, useMemo } from 'react'
import { Navigate, Route, Routes, matchPath, useLocation } from 'react-router-dom'
import { shouldDisableNFTRoutesAtom } from 'state/application/atoms'
import { t } from 'uniswap/src/i18n'
import { isBrowserRouterEnabled } from 'utils/env'
// High-traffic pages (index and /swap) should not be lazy-loaded.
import Landing from 'pages/Landing'
import { CreatePosition } from 'pages/Pool/Positions/create/CreatePosition'
import Swap from 'pages/Swap'

const NftExplore = lazy(() => import('nft/pages/explore'))
const Collection = lazy(() => import('nft/pages/collection'))
const Profile = lazy(() => import('nft/pages/profile'))
const Asset = lazy(() => import('nft/pages/asset/Asset'))
const AddLiquidityV3WithTokenRedirects = lazy(() => import('pages/AddLiquidityV3/redirects'))
const AddLiquidityV2WithTokenRedirects = lazy(() => import('pages/AddLiquidityV2/redirects'))
const RedirectExplore = lazy(() => import('pages/Explore/redirects'))
const MigrateV2 = lazy(() => import('pages/MigrateV2'))
const MigrateV2Pair = lazy(() => import('pages/MigrateV2/MigrateV2Pair'))
const MigrateV3 = lazy(() => import('pages/MigrateV3'))
const NotFound = lazy(() => import('pages/NotFound'))
const Pool = lazy(() => import('pages/Pool'))
const LegacyPoolRedirects = lazy(() =>
  import('pages/LegacyPool/redirects').then((module) => ({ default: module.LegacyPoolRedirects })),
)
const PoolFinderRedirects = lazy(() =>
  import('pages/LegacyPool/redirects').then((module) => ({ default: module.PoolFinderRedirects })),
)
const LegacyPoolV2Redirects = lazy(() =>
  import('pages/LegacyPool/redirects').then((module) => ({ default: module.LegacyPoolV2Redirects })),
)
const LegacyPositionPageRedirects = lazy(() =>
  import('pages/LegacyPool/redirects').then((module) => ({ default: module.LegacyPositionPageRedirects })),
)
const PositionPage = lazy(() => import('pages/Pool/Positions/PositionPage'))
const V2PositionPage = lazy(() => import('pages/Pool/Positions/V2PositionPage'))
const PoolDetails = lazy(() => import('pages/PoolDetails'))
const RemoveLiquidityV2 = lazy(() => import('pages/RemoveLiquidity/V2'))
const RemoveLiquidityV3 = lazy(() => import('pages/RemoveLiquidity/V3'))
const TokenDetails = lazy(() => import('pages/TokenDetails'))

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
    [browserRouterEnabled, hash, shouldDisableNFTRoutes],
  )
}

// SEO titles and descriptions sourced from https://docs.google.com/spreadsheets/d/1_6vSxGgmsx6QGEZ4mdHppv1VkuiJEro3Y_IopxUHGB4/edit#gid=0
// getTitle and getDescription are used as static metatags for SEO. Dynamic metatags should be set in the page component itself
const StaticTitlesAndDescriptions = {
  UniswapTitle: t('title.uniswapTradeCrypto'),
  SwapTitle: t('title.buySellTradeEthereum'),
  SwapDescription: t('title.swappingMadeSimple'),
  DetailsPageBaseTitle: t('common.buyAndSell'),
  TDPDescription: t('title.realTime'),
  PDPDescription: t('title.tradeTokens'),
  NFTTitle: t('title.explore'),
  MigrateTitle: t('title.migratev2'),
  MigrateTitleV3: t('title.migratev3'),
  MigrateDescription: t('title.easilyRemove'),
  MigrateDescriptionV4: t('title.easilyRemoveV4'),
  AddLiquidityDescription: t('title.earnFees'),
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
    getTitle: () => t('common.buyAndSell'),
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
    getTitle: () => t('title.voteOnGov'),
    getDescription: () => t('title.uniToken'),
    getElement: () => {
      return (
        <Routes>
          <Route
            path="*"
            Component={() => {
              window.location.href = 'https://vote.uniswapfoundation.org'
              return null
            }}
          ></Route>
        </Routes>
      )
    },
  }),
  createRouteDefinition({
    path: '/create-proposal',
    getTitle: () => t('title.createGovernanceOn'),
    getDescription: () => t('title.createGovernanceTo'),
    getElement: () => <Navigate to="/vote/create-proposal" replace />,
  }),
  createRouteDefinition({
    path: '/buy',
    getElement: () => <Swap />,
    getTitle: () => StaticTitlesAndDescriptions.SwapTitle,
  }),
  createRouteDefinition({
    path: '/send',
    getElement: () => <Swap />,
    getTitle: () => t('title.sendTokens'),
  }),
  createRouteDefinition({
    path: '/limits',
    getElement: () => <Navigate to="/limit" replace />,
    getTitle: () => t('title.placeLimit'),
  }),
  createRouteDefinition({
    path: '/limit',
    getElement: () => <Swap />,
    getTitle: () => t('title.placeLimit'),
  }),
  createRouteDefinition({
    path: '/buy',
    getElement: () => <Swap />,
    getTitle: () => StaticTitlesAndDescriptions.SwapTitle,
  }),
  createRouteDefinition({
    path: '/swap',
    getElement: () => <Swap />,
    getTitle: () => StaticTitlesAndDescriptions.SwapTitle,
  }),
  // Refreshed pool routes
  createRouteDefinition({
    path: '/positions/create',
    getElement: () => <CreatePosition />,
    getTitle: getPositionPageTitle,
    getDescription: getPositionPageDescription,
    nestedPaths: [':protocolVersion'],
  }),
  createRouteDefinition({
    path: '/positions',
    getElement: () => <Pool />,
    getTitle: getPositionPageTitle,
    getDescription: getPositionPageDescription,
  }),
  createRouteDefinition({
    path: '/positions/v2/:chainName/:pairAddress',
    getElement: () => <V2PositionPage />,
    getTitle: getPositionPageTitle,
    getDescription: getPositionPageDescription,
  }),
  createRouteDefinition({
    path: '/positions/v3/:chainName/:tokenId',
    getElement: () => <PositionPage />,
    getTitle: getPositionPageTitle,
    getDescription: getPositionPageDescription,
  }),
  createRouteDefinition({
    path: '/positions/v4/:chainName/:tokenId',
    getElement: () => <PositionPage />,
    getTitle: getPositionPageTitle,
    getDescription: getPositionPageDescription,
  }),
  createRouteDefinition({
    path: '/migrate/v3/:chainName/:tokenId',
    getElement: () => <MigrateV3 />,
    getTitle: () => StaticTitlesAndDescriptions.MigrateTitleV3,
    getDescription: () => StaticTitlesAndDescriptions.MigrateDescriptionV4,
  }),
  // Legacy pool routes
  createRouteDefinition({
    path: '/pool',
    getElement: () => <LegacyPoolRedirects />,
    getTitle: getPositionPageTitle,
    getDescription: getPositionPageDescription,
  }),
  createRouteDefinition({
    path: '/pool/v2/find',
    getElement: () => <PoolFinderRedirects />,
    getTitle: getPositionPageDescription,
    getDescription: getPositionPageDescription,
  }),
  createRouteDefinition({
    path: '/pool/v2',
    getElement: () => <LegacyPoolV2Redirects />,
    getTitle: getPositionPageTitle,
    getDescription: getPositionPageDescription,
  }),
  createRouteDefinition({
    path: '/pool/:tokenId',
    getElement: () => <LegacyPositionPageRedirects />,
    getTitle: getPositionPageTitle,
    getDescription: getPositionPageDescription,
  }),
  createRouteDefinition({
    path: '/pools/v2/find',
    getElement: () => <PoolFinderRedirects />,
    getTitle: getPositionPageTitle,
    getDescription: getPositionPageDescription,
  }),
  createRouteDefinition({
    path: '/pools/v2',
    getElement: () => <LegacyPoolV2Redirects />,
    getTitle: getPositionPageTitle,
    getDescription: getPositionPageDescription,
  }),
  createRouteDefinition({
    path: '/pools',
    getElement: () => <LegacyPoolRedirects />,
    getTitle: getPositionPageTitle,
    getDescription: getPositionPageDescription,
  }),
  createRouteDefinition({
    path: '/pools/:tokenId',
    getElement: () => <LegacyPositionPageRedirects />,
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
    getElement: () => <AddLiquidityV3WithTokenRedirects />,
    getTitle: getAddLiquidityPageTitle,
    getDescription: () => StaticTitlesAndDescriptions.AddLiquidityDescription,
  }),
  createRouteDefinition({
    path: '/remove/v2/:currencyIdA/:currencyIdB',
    getElement: () => <RemoveLiquidityV2 />,
    getTitle: () => t('title.removeLiquidityv2'),
    getDescription: () => t('title.removeTokensv2'),
  }),
  createRouteDefinition({
    path: '/remove/:tokenId',
    getElement: () => <RemoveLiquidityV3 />,
    getTitle: () => t('title.removePoolLiquidity'),
    getDescription: () => t('title.removev3Liquidity'),
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
    getTitle: () => t('title.exploreNFTs'),
    getDescription: () => t('title.betterPricesMoreListings'),
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
    getDescription: () => t('title.manageNFT'),
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
