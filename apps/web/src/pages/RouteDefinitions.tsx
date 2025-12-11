import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { getExploreDescription, getExploreTitle } from 'pages/getExploreTitle'
import { getPortfolioDescription, getPortfolioTitle } from 'pages/getPortfolioTitle'
import { getAddLiquidityPageTitle, getPositionPageDescription, getPositionPageTitle } from 'pages/getPositionPageTitle'
// High-traffic pages (index and /swap) should not be lazy-loaded.
import Landing from 'pages/Landing'
import Swap from 'pages/Swap'
import { lazy, ReactNode, Suspense, useMemo } from 'react'
import { matchPath, Navigate, Route, Routes, useLocation } from 'react-router'
import { WRAPPED_PATH } from 'uniswap/src/components/banners/shared/utils'
import { CHROME_EXTENSION_UNINSTALL_URL_PATH } from 'uniswap/src/constants/urls'
import { WRAPPED_SOL_ADDRESS_SOLANA } from 'uniswap/src/features/chains/svm/defaults'
import { EXTENSION_PASSKEY_AUTH_PATH } from 'uniswap/src/features/passkey/constants'
import i18n from 'uniswap/src/i18n'
import { isBrowserRouterEnabled } from 'utils/env'

const CreatePosition = lazy(() => import('pages/CreatePosition/CreatePosition'))
const AddLiquidityV3WithTokenRedirects = lazy(() => import('pages/AddLiquidityV3/redirects'))
const AddLiquidityV2WithTokenRedirects = lazy(() => import('pages/AddLiquidityV2/redirects'))
const RedirectExplore = lazy(() => import('pages/Explore/redirects'))
const LegacyMigrateV2 = lazy(() => import('pages/MigrateV2'))
const LegacyMigrateV2Pair = lazy(() => import('pages/MigrateV2/MigrateV2Pair'))
const MigrateV3 = lazy(() => import('pages/Migrate'))
const NotFound = lazy(() => import('pages/NotFound'))
const Pool = lazy(() => import('pages/Positions'))
const LegacyPoolRedirects = lazy(() =>
  import('pages/LegacyPool/redirects').then((module) => ({ default: module.LegacyPoolRedirects })),
)
const PoolFinderRedirects = lazy(() =>
  import('pages/LegacyPool/redirects').then((module) => ({ default: module.PoolFinderRedirects })),
)
const LegacyPositionPageRedirects = lazy(() =>
  import('pages/LegacyPool/redirects').then((module) => ({ default: module.LegacyPositionPageRedirects })),
)
const RemoveLiquidityV2WithTokenRedirects = lazy(() =>
  import('pages/LegacyPool/redirects').then((module) => ({ default: module.RemoveLiquidityV2WithTokenRedirects })),
)
const PositionPage = lazy(() => import('pages/Positions/PositionPage'))
const V2PositionPage = lazy(() => import('pages/Positions/V2PositionPage'))
const PoolDetails = lazy(() => import('pages/PoolDetails'))
const TokenDetails = lazy(() => import('pages/TokenDetails'))
const ExtensionPasskeyAuthPopUp = lazy(() => import('pages/ExtensionPasskeyAuthPopUp'))
const PasskeyManagement = lazy(() => import('pages/PasskeyManagement'))
const ExtensionUninstall = lazy(() => import('pages/ExtensionUninstall/ExtensionUninstall'))
const Portfolio = lazy(() => import('pages/Portfolio/Portfolio'))
const ToucanToken = lazy(() => import('pages/Explore/ToucanToken'))
const Wrapped = lazy(() => import('pages/Wrapped'))

interface RouterConfig {
  browserRouterEnabled?: boolean
  hash?: string
  isEmbeddedWalletEnabled?: boolean
  isPortfolioPageEnabled?: boolean
  isToucanEnabled?: boolean
  isWrappedEnabled?: boolean
}

/**
 * Convenience hook which organizes the router configuration into a single object.
 */
export function useRouterConfig(): RouterConfig {
  const browserRouterEnabled = isBrowserRouterEnabled()
  const { hash } = useLocation()
  const isEmbeddedWalletEnabled = useFeatureFlag(FeatureFlags.EmbeddedWallet)
  const isPortfolioPageEnabled = useFeatureFlag(FeatureFlags.PortfolioPage)
  const isToucanEnabled = useFeatureFlag(FeatureFlags.Toucan)
  const isWrappedEnabled = useFeatureFlag(FeatureFlags.UniswapWrapped2025)

  return useMemo(
    () => ({
      browserRouterEnabled,
      hash,
      isEmbeddedWalletEnabled,
      isPortfolioPageEnabled,
      isToucanEnabled,
      isWrappedEnabled,
    }),
    [browserRouterEnabled, hash, isEmbeddedWalletEnabled, isPortfolioPageEnabled, isToucanEnabled, isWrappedEnabled],
  )
}

// SEO titles and descriptions sourced from https://docs.google.com/spreadsheets/d/1_6vSxGgmsx6QGEZ4mdHppv1VkuiJEro3Y_IopxUHGB4/edit#gid=0
// getTitle and getDescription are used as static metatags for SEO. Dynamic metatags should be set in the page component itself
const StaticTitlesAndDescriptions = {
  UniswapTitle: i18n.t('title.uniswapTradeCrypto'),
  SwapTitle: i18n.t('title.buySellTradeEthereum'),
  SwapDescription: i18n.t('title.swappingMadeSimple'),
  DetailsPageBaseTitle: i18n.t('common.buyAndSell'),
  TDPDescription: i18n.t('title.realTime'),
  PDPDescription: i18n.t('title.tradeTokens'),
  MigrateTitle: i18n.t('title.migratev2'),
  MigrateTitleV3: i18n.t('title.migratev3'),
  MigrateDescription: i18n.t('title.easilyRemove'),
  MigrateDescriptionV4: i18n.t('title.easilyRemoveV4'),
  AddLiquidityDescription: i18n.t('title.earnFees'),
  PasskeyManagementTitle: i18n.t('title.managePasskeys'),
  // TODO(LP-295): Update after launch
  ToucanPlaceholderDescription: 'Placeholder description for Toucan page',
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
  // Special case: redirect WSOL to SOL TDP, as directly trading WSOL is not supported currently.
  createRouteDefinition({
    path: `/explore/tokens/solana/${WRAPPED_SOL_ADDRESS_SOLANA}`,
    getTitle: () => i18n.t('common.buyAndSell'),
    getDescription: () => StaticTitlesAndDescriptions.TDPDescription,
    getElement: () => <Navigate to="/explore/tokens/solana/NATIVE" replace />,
  }),
  createRouteDefinition({
    path: '/explore/tokens/:chainName/:tokenAddress',
    getTitle: () => i18n.t('common.buyAndSell'),
    getDescription: () => StaticTitlesAndDescriptions.TDPDescription,
    getElement: () => (
      <Suspense fallback={null}>
        <TokenDetails />
      </Suspense>
    ),
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
    path: '/explore/auctions/:chainName/:id',
    getTitle: () => StaticTitlesAndDescriptions.DetailsPageBaseTitle,
    getDescription: () => StaticTitlesAndDescriptions.ToucanPlaceholderDescription,
    enabled: (args) => args.isToucanEnabled ?? false,
    getElement: () => (
      <Suspense fallback={null}>
        <ToucanToken />
      </Suspense>
    ),
  }),
  createRouteDefinition({
    path: '/vote/*',
    getTitle: () => i18n.t('title.voteOnGov'),
    getDescription: () => i18n.t('title.uniToken'),
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
    getTitle: () => i18n.t('title.createGovernanceOn'),
    getDescription: () => i18n.t('title.createGovernanceTo'),
    getElement: () => <Navigate to="/vote/create-proposal" replace />,
  }),
  createRouteDefinition({
    path: '/buy',
    getElement: () => <Swap />,
    getTitle: () => StaticTitlesAndDescriptions.SwapTitle,
  }),
  createRouteDefinition({
    path: '/sell',
    getElement: () => <Swap />,
    getTitle: () => StaticTitlesAndDescriptions.SwapTitle,
  }),
  createRouteDefinition({
    path: '/send',
    getElement: () => <Swap />,
    getTitle: () => i18n.t('title.sendTokens'),
  }),
  createRouteDefinition({
    path: '/limits',
    getElement: () => <Navigate to="/limit" replace />,
    getTitle: () => i18n.t('title.placeLimit'),
  }),
  createRouteDefinition({
    path: '/limit',
    getElement: () => <Swap />,
    getTitle: () => i18n.t('title.placeLimit'),
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
    path: '/migrate/v2/:chainName/:pairAddress',
    getElement: () => <MigrateV3 />,
    getTitle: () => StaticTitlesAndDescriptions.MigrateTitle,
    getDescription: () => StaticTitlesAndDescriptions.MigrateDescription,
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
    getElement: () => <LegacyPositionPageRedirects />,
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
    getElement: () => <RemoveLiquidityV2WithTokenRedirects />,
    getTitle: () => i18n.t('title.removeLiquidityv2'),
    getDescription: () => i18n.t('title.removeTokensv2'),
  }),
  createRouteDefinition({
    path: '/remove/:tokenId',
    getElement: () => <LegacyPositionPageRedirects />,
    getTitle: () => i18n.t('title.removePoolLiquidity'),
    getDescription: () => i18n.t('title.removev3Liquidity'),
  }),
  createRouteDefinition({
    path: '/migrate/v2',
    getElement: () => <LegacyMigrateV2 />,
    getTitle: () => StaticTitlesAndDescriptions.MigrateTitle,
    getDescription: () => StaticTitlesAndDescriptions.MigrateDescription,
  }),
  createRouteDefinition({
    path: '/migrate/v2/:address',
    getElement: () => <LegacyMigrateV2Pair />,
    getTitle: () => StaticTitlesAndDescriptions.MigrateTitle,
    getDescription: () => StaticTitlesAndDescriptions.MigrateDescription,
  }),
  createRouteDefinition({
    path: EXTENSION_PASSKEY_AUTH_PATH,
    getElement: () => <ExtensionPasskeyAuthPopUp />,
    getTitle: () => i18n.t('title.extensionPasskeyLogIn'),
  }),
  createRouteDefinition({
    path: '/manage/passkey/:walletAddress',
    getElement: () => <PasskeyManagement />,
    getTitle: () => StaticTitlesAndDescriptions.PasskeyManagementTitle,
    enabled: (args) => args.isEmbeddedWalletEnabled ?? false,
  }),
  // Portfolio Pages
  createRouteDefinition({
    path: '/portfolio',
    getElement: () => <Portfolio />,
    getTitle: getPortfolioTitle,
    getDescription: getPortfolioDescription,
    enabled: (args) => args.isPortfolioPageEnabled ?? false,
    nestedPaths: ['tokens', 'defi', 'nfts', 'activity'],
  }),
  // Uniswap Extension Uninstall Page
  createRouteDefinition({
    path: CHROME_EXTENSION_UNINSTALL_URL_PATH,
    getElement: () => <ExtensionUninstall />,
    getTitle: () => i18n.t('title.extension.uninstall'),
  }),
  // Uniswap Wrapped
  createRouteDefinition({
    path: WRAPPED_PATH,
    getElement: () => <Wrapped />,
    getTitle: () => 'Uniswap Wrapped',
    enabled: (args) => args.isWrappedEnabled ?? false,
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
