import { EXTENSION_PASSKEY_AUTH_PATH } from '@universe/embedded-wallet'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { Suspense, useMemo } from 'react'
import { matchPath, Navigate, Route, Routes, useLocation } from 'react-router'
import { USDC_ARC } from 'uniswap/src/constants/tokens'
import { CHROME_EXTENSION_UNINSTALL_URL_PATH } from 'uniswap/src/constants/urls'
import { WRAPPED_SOL_ADDRESS_SOLANA } from 'uniswap/src/features/chains/svm/defaults'
import i18n from 'uniswap/src/i18n'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { isEmbedPath } from '~/pages/embedPaths'
import { EMBED_ENTRY_ROUTES } from '~/pages/embedRoutes'
import { getCategoryDetailsTitle, getExploreDescription, getExploreTitle } from '~/pages/getExploreTitle'
import { getPortfolioDescription, getPortfolioTitle } from '~/pages/getPortfolioTitle'
import {
  getAddLiquidityPageTitle,
  getPositionPageDescription,
  getPositionPageTitle,
} from '~/pages/getPositionPageTitle'
// High-traffic pages (index and /swap) should not be lazy-loaded.
import { Landing } from '~/pages/Landing'
import {
  createRouteDefinition,
  type RouteDefinition,
  type RouterConfig,
  StaticTitlesAndDescriptions,
} from '~/pages/routeDefinition'
import { SwapPage } from '~/pages/Swap'
import { ON_RAMP_RETURN_PATH } from '~/pages/Swap/Buy/onRampRedirectUrl'
import { OnRampReturn } from '~/pages/Swap/Buy/OnRampReturn'
import { isBrowserRouterEnabled } from '~/utils/env'
import { createLazy } from '~/utils/lazyWithRetry'

const AddLiquidity = createLazy(() => import('~/pages/AddLiquidity/AddLiquidity'))
const CreatePosition = createLazy(() => import('~/pages/CreatePosition/CreatePosition'))
const AddLiquidityV3WithTokenRedirects = createLazy(() => import('~/pages/AddLiquidityV3/redirects'))
const AddLiquidityV2WithTokenRedirects = createLazy(() => import('~/pages/AddLiquidityV2/redirects'))
const CreatePositionRedirects = createLazy(() => import('~/pages/CreatePosition/redirects'))
const RedirectExplore = createLazy(() => import('~/pages/Explore/redirects'))
const MigrateV3 = createLazy(() => import('~/pages/Migrate'))
const NotFound = createLazy(() => import('~/pages/NotFound'))
const Pool = createLazy(() => import('~/pages/Positions'))
const LegacyPoolRedirects = createLazy(() =>
  import('~/pages/LegacyPool/redirects').then((module) => ({ default: module.LegacyPoolRedirects })),
)
const LegacyPositionPageRedirects = createLazy(() =>
  import('~/pages/LegacyPool/redirects').then((module) => ({ default: module.LegacyPositionPageRedirects })),
)
const RemoveLiquidityV2WithTokenRedirects = createLazy(() =>
  import('~/pages/LegacyPool/redirects').then((module) => ({ default: module.RemoveLiquidityV2WithTokenRedirects })),
)
const PositionPage = createLazy(() => import('~/pages/Positions/PositionPage'))
const V2PositionPage = createLazy(() => import('~/pages/Positions/V2PositionPage'))
const PoolDetails = createLazy(() => import('~/pages/PoolDetails'))
const TokenDetails = createLazy(() => import('~/pages/TokenDetails/TokenDetailsPage'))
const CategoryDetails = createLazy(() => import('~/pages/Explore/CategoryDetails'))
const ExtensionPasskeyAuthPopUp = createLazy(() => import('~/pages/ExtensionPasskeyAuthPopUp'))
const PasskeyManagement = createLazy(() => import('~/pages/PasskeyManagement'))
const ExtensionUninstall = createLazy(() => import('~/pages/ExtensionUninstall/ExtensionUninstall'))
const Portfolio = createLazy(() => import('~/pages/Portfolio/Portfolio'))
const ToucanToken = createLazy(() => import('~/pages/Explore/ToucanToken'))
const CreateAuction = createLazy(() => import('~/pages/Liquidity/CreateAuction/CreateAuction'))
const XOAuthCallbackPage = createLazy(() => import('~/pages/Liquidity/CreateAuction/XOAuthCallbackPage'))
const BetaPage = createLazy(() => import('~/pages/Beta'))
const Launches = createLazy(() => import('~/pages/Launches'))

/**
 * Convenience hook which organizes the router configuration into a single object.
 */
export function useRouterConfig(): RouterConfig {
  const browserRouterEnabled = isBrowserRouterEnabled()
  const { hash } = useLocation()
  const isEmbeddedWalletEnabled = useFeatureFlag(FeatureFlags.EmbeddedWallet)

  return useMemo(
    () => ({
      browserRouterEnabled,
      hash,
      isEmbeddedWalletEnabled,
    }),
    [browserRouterEnabled, hash, isEmbeddedWalletEnabled],
  )
}

export const routes: RouteDefinition[] = [
  createRouteDefinition({
    path: '/',
    getTitle: () => StaticTitlesAndDescriptions.UniswapTitle,
    getDescription: () => StaticTitlesAndDescriptions.SwapDescription,
    getElement: (args) => {
      if (args.browserRouterEnabled && args.hash) {
        const path = args.hash.replace('#', '')
        // Only redirect to internal paths starting with a single '/' to prevent
        // protocol-relative URLs (e.g. //example.org) from causing SecurityErrors.
        if (path.startsWith('/') && !path.startsWith('//')) {
          return <Navigate to={path} replace />
        }
      }
      return <Landing />
    },
  }),
  // Must precede /explore: findRouteByPath is first-match and /explore's :tab/:chainName nested path also matches this URL.
  createRouteDefinition({
    path: '/explore/category/:categorySlug',
    getTitle: getCategoryDetailsTitle,
    getDescription: getExploreDescription,
    getElement: () => (
      <Suspense fallback={null}>
        <CategoryDetails />
      </Suspense>
    ),
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
  // Arc's native USDC is indexed and traded through its canonical ERC-20 precompile.
  createRouteDefinition({
    path: `/explore/tokens/arc/${NATIVE_CHAIN_ID}`,
    getTitle: () => i18n.t('common.buyAndSell'),
    getDescription: () => StaticTitlesAndDescriptions.TDPDescription,
    getElement: () => <Navigate to={`/explore/tokens/arc/${USDC_ARC.address}`} replace />,
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
    path: '/explore/auctions/:chainName/:auctionAddress',
    getTitle: () => StaticTitlesAndDescriptions.DetailsPageBaseTitle,
    getDescription: () => StaticTitlesAndDescriptions.ToucanAuctionDescription,
    getElement: () => (
      <Suspense fallback={null}>
        <ToucanToken />
      </Suspense>
    ),
  }),
  createRouteDefinition({
    path: '/launches',
    getTitle: () => i18n.t('common.launches'),
    getDescription: () => StaticTitlesAndDescriptions.ToucanAuctionDescription,
    getElement: () => (
      <Suspense fallback={null}>
        <Launches />
      </Suspense>
    ),
  }),
  createRouteDefinition({
    path: '/liquidity/launch-auction',
    getTitle: () => i18n.t('toucan.createAuction.title'),
    getDescription: () => StaticTitlesAndDescriptions.ToucanLaunchAuctionDescription,
    getElement: () => (
      <Suspense fallback={null}>
        <CreateAuction />
      </Suspense>
    ),
  }),
  createRouteDefinition({
    path: '/liquidity/launch-auction/x/callback',
    getTitle: () => 'X Verification',
    getDescription: () => StaticTitlesAndDescriptions.ToucanLaunchAuctionDescription,
    getElement: () => (
      <Suspense fallback={null}>
        <XOAuthCallbackPage />
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
            // oxlint-disable-next-line react/self-closing-comp -- biome-parity: oxlint is stricter here
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
    getElement: () => <SwapPage />,
    getTitle: () => StaticTitlesAndDescriptions.SwapTitle,
  }),
  createRouteDefinition({
    path: '/sell',
    getElement: () => <SwapPage />,
    getTitle: () => StaticTitlesAndDescriptions.SwapTitle,
  }),
  createRouteDefinition({
    path: '/send',
    getElement: () => <SwapPage />,
    getTitle: () => i18n.t('title.sendTokens'),
  }),
  createRouteDefinition({
    path: '/limits',
    getElement: () => <Navigate to="/limit" replace />,
    getTitle: () => i18n.t('title.placeLimit'),
  }),
  createRouteDefinition({
    path: '/limit',
    getElement: () => <SwapPage />,
    getTitle: () => i18n.t('title.placeLimit'),
  }),
  createRouteDefinition({
    path: '/buy',
    getElement: () => <SwapPage />,
    getTitle: () => StaticTitlesAndDescriptions.SwapTitle,
  }),
  createRouteDefinition({
    path: ON_RAMP_RETURN_PATH,
    getElement: () => <OnRampReturn />,
    getTitle: () => StaticTitlesAndDescriptions.SwapTitle,
  }),
  createRouteDefinition({
    path: '/swap',
    getElement: () => <SwapPage />,
    getTitle: () => StaticTitlesAndDescriptions.SwapTitle,
  }),
  // Refreshed pool routes
  createRouteDefinition({
    path: '/positions/add/new',
    getElement: () => <CreatePosition />,
    getTitle: getPositionPageTitle,
    getDescription: () => StaticTitlesAndDescriptions.AddLiquidityDescription,
  }),
  createRouteDefinition({
    path: '/positions/add',
    // Nested path is optional: bare `/positions/add` browses pools; AddLiquidity reads the
    // optional `:chainName/:poolAddress` segments from `useParams`, so one definition covers both.
    nestedPaths: [':chainName/:poolAddress'],
    getElement: () => <AddLiquidity />,
    getTitle: getPositionPageTitle,
    getDescription: () => StaticTitlesAndDescriptions.AddLiquidityDescription,
  }),
  // Retired: the create form now lives at `/positions/add/new`. Kept as a redirect because these
  // URLs are externally linkable — the `/add` and `/add/v2` legacy routes point here, and they are
  // bookmarked and shared.
  createRouteDefinition({
    path: '/positions/create',
    getElement: () => <CreatePositionRedirects />,
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
    getElement: () => <LegacyPoolRedirects />,
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
    getElement: () => <LegacyPoolRedirects />,
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
    nestedPaths: [
      'tokens',
      'pools',
      'defi',
      'nfts',
      'activity',
      ':walletAddress',
      ':walletAddress/tokens',
      ':walletAddress/pools',
      ':walletAddress/defi',
      ':walletAddress/nfts',
      ':walletAddress/activity',
    ],
  }),
  // Uniswap Extension Uninstall Page
  createRouteDefinition({
    path: CHROME_EXTENSION_UNINSTALL_URL_PATH,
    getElement: () => <ExtensionUninstall />,
    getTitle: () => i18n.t('title.extension.uninstall'),
  }),
  createRouteDefinition({
    path: '/preview',
    getTitle: () => 'Uniswap Preview',
    getElement: () => (
      <Suspense fallback={null}>
        <BetaPage />
      </Suspense>
    ),
  }),
  createRouteDefinition({ path: '*', getElement: () => <Navigate to="/not-found" replace /> }),
  createRouteDefinition({ path: '/not-found', getElement: () => <NotFound /> }),
]

// Route primitives live in a sibling module (routeDefinition.tsx) to keep this file
// within the max-lines limit; re-exported here so consumers keep a single import.
export type { RouteDefinition } from '~/pages/routeDefinition'
// Re-exported here so consumers keep a single import (see embedRoutes.tsx / Body.tsx).
export { EMBED_ENTRY_ROUTES } from '~/pages/embedRoutes'

export const findRouteByPath = (pathname: string) => {
  // Search /embed entry routes first so /embed and /embed/* resolve before the `*` catch-all.
  const searchSpace = isEmbedPath(pathname) ? [...EMBED_ENTRY_ROUTES, ...routes] : routes
  for (const route of searchSpace) {
    const match = matchPath(route.path, pathname)
    if (match) {
      return route
    }
    const subPaths = route.nestedPaths.map((nestedPath) => `${route.path}/${nestedPath}`)
    for (const subPath of subPaths) {
      // oxlint-disable-next-line no-shadow
      const match = matchPath(subPath, pathname)
      if (match) {
        return route
      }
    }
  }
  return undefined
}
