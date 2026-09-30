import { isE2eTestEnv } from '@universe/environment'
import {
  DynamicConfigs,
  Experiments,
  FeatureFlags,
  LayerProperties,
  Layers,
  NetworkRequestsConfigKey,
  WEB_FEATURE_FLAG_NAMES,
} from '@universe/gating'
import type { ReactNode } from 'react'

// Shared by the row that renders each label and by the search text that matches it.
export const EXTENSION_ID_LABEL = 'Which Extension the web app will communicate with'
export const NETWORK_REQUESTS_LABEL = 'Max refetch attempts'
export const EMBEDDED_WALLET_ONBOARDING_LABEL =
  'newFlowEnabled: on = test (new onboarding UX), off = control (current flow)'

const SEARCHABLE_LAYERS = [Layers.SwapPage, Layers.Discovery]

export interface FlagDef {
  flag: FeatureFlags
  label?: string
}

/**
 * A non-gate row in the modal: an experiment, a Statsig layer, or a dynamic config.
 *
 * Gates get their searchable identity from `FlagDef`; these rows carry their own so the
 * search box filters all three sections off the same query. `node` renders its own title
 * and label — `name` and `searchText` exist only for matching, and `name` doubles as the
 * React key.
 */
export interface ExtraItemDef {
  name: string
  searchText?: string
  node: ReactNode
}

export interface FlagGroupDef {
  name: string
  flags: FlagDef[]
  extraItems?: readonly ExtraItemDef[]
}

/**
 * Build the static portion of flag groups (no hooks required).
 * Groups that need runtime values (e.g. extension ID) accept them via `extras`.
 */
export function buildFlagGroups(extras: {
  extensionDropdown: ReactNode
  networkRequestsConfig: ReactNode
  experimentOptions: ReactNode
  layerOption: (layerName: Layers) => ReactNode
  complianceOverrides: ReactNode
}): FlagGroupDef[] {
  const groups: FlagGroupDef[] = [
    {
      name: 'Sessions',
      flags: [
        { flag: FeatureFlags.HashcashSolverEnabled, label: 'Enable Hashcash Solver' },
        { flag: FeatureFlags.TurnstileSolverEnabled, label: 'Enable Turnstile Solver' },
      ],
    },
    {
      name: 'XLayer',
      flags: [{ flag: FeatureFlags.XLayer, label: 'Enable XLayer UX' }],
    },
    {
      name: 'Swap Features',
      flags: [
        { flag: FeatureFlags.Margin, label: 'Enable Margin trading tab' },
        { flag: FeatureFlags.NoUniswapInterfaceFees, label: 'Turn off Uniswap interface fees' },
        { flag: FeatureFlags.ChainedActions, label: 'Enable Chained Actions' },
        { flag: FeatureFlags.BatchedSwaps, label: 'Enable Batched Swaps' },
        { flag: FeatureFlags.GasFeeOverrides, label: 'Enable Custom Gas Fee Overrides' },
        { flag: FeatureFlags.UniquoteEnabled, label: 'Enable Uniquote' },
        { flag: FeatureFlags.UnirouteEnabled, label: 'Enable Uniroute' },
        { flag: FeatureFlags.RequestSwapSteps, label: 'Request SwapSteps in classic quotes' },
        { flag: FeatureFlags.UseUniversalRouterVersion211, label: 'Use Universal Router v2.1.1' },
        { flag: FeatureFlags.ViemProviderEnabled, label: 'Enable Viem Provider' },
        { flag: FeatureFlags.LimitsFees, label: 'Enable Limits fees' },
        { flag: FeatureFlags.LimitCancelTimeout, label: 'Enable limit order cancellation timeout + revert flow' },
        { flag: FeatureFlags.EnablePermitMismatchUX, label: 'Enable Permit2 mismatch detection' },
        { flag: FeatureFlags.NetworkFilterV2, label: 'Enable Network Filter V2' },
        {
          flag: FeatureFlags.ForcePermitTransactions,
          label: 'Force Permit2 transaction instead of signatures, always',
        },
        {
          flag: FeatureFlags.ForceDisableWalletGetCapabilities,
          label: 'Force disable wallet get capabilities result',
        },
        {
          flag: FeatureFlags.AllowUniswapXOnlyRoutesInSwapSettings,
          label: 'Allow UniswapX-Only Routes in Swap Settings (for local testing only)',
        },
      ],
    },
    {
      name: 'UniswapX',
      flags: [{ flag: FeatureFlags.UniswapX, label: 'Enable UniswapX' }],
    },
    {
      name: 'LP',
      flags: [
        { flag: FeatureFlags.AdvancedPoolsFiltering, label: 'Enable Advanced Pools Filtering' },
        { flag: FeatureFlags.LpPdpDepthChart, label: 'Enable LP PDP Depth Chart toggle' },
        { flag: FeatureFlags.LiquidityBatchedTransactions, label: 'Enable Batched Transactions for LP flow' },
      ],
    },
    {
      name: 'Toucan',
      flags: [
        {
          flag: FeatureFlags.ToucanTickDetailsTooltip,
          label: 'Show Remaining (currency required) on chart-bar tooltip',
        },
        { flag: FeatureFlags.AuctionSearch, label: 'Enable Auction Search' },
      ],
    },
    {
      name: 'Launches',
      flags: [
        { flag: FeatureFlags.QuickLaunch, label: 'Enable Quick Launch' },
        {
          flag: FeatureFlags.EnablePoolsXyzBanner,
          label: 'Show the existing Pools.xyz promo banner (wins over the teaser flag)',
        },
        {
          flag: FeatureFlags.EnablePoolsXyzTeaser,
          label: 'Show the new Pools.xyz teaser banner (only applies when the promo banner flag is off)',
        },
      ],
    },
    {
      name: 'Embedded Wallet',
      flags: [
        { flag: FeatureFlags.EmbeddedWallet, label: 'Add internal embedded wallet functionality' },
        {
          flag: FeatureFlags.DisableV1EwRotation,
          label: 'Disable v1 embedded-wallet recovery rotation (force passkey sign-in)',
        },
        {
          flag: FeatureFlags.Support7677GasSponsorship,
          label: 'Advertise EIP-7677 paymaster sponsorship in wallet_getCapabilities',
        },
      ],
      extraItems: [
        {
          name: DynamicConfigs.ExternallyConnectableExtension,
          searchText: EXTENSION_ID_LABEL,
          node: extras.extensionDropdown,
        },
      ],
    },
    {
      name: 'New Chains',
      flags: [
        { flag: FeatureFlags.Arc, label: 'Enable Arc' },
        { flag: FeatureFlags.Ink, label: 'Enable Ink' },
        { flag: FeatureFlags.Linea, label: 'Enable Linea' },
        { flag: FeatureFlags.MegaETH, label: 'Enable MegaETH' },
        { flag: FeatureFlags.Robinhood, label: 'Enable Robinhood' },
        { flag: FeatureFlags.Tempo, label: 'Enable Tempo' },
      ],
    },
    {
      name: 'Network Requests',
      flags: [],
      extraItems: [
        {
          name: DynamicConfigs.NetworkRequests,
          searchText: `${NetworkRequestsConfigKey.BalanceMaxRefetchAttempts} ${NETWORK_REQUESTS_LABEL}`,
          node: extras.networkRequestsConfig,
        },
      ],
    },
    {
      name: 'RPC',
      flags: [{ flag: FeatureFlags.UniRpcEnabled, label: 'Route chain RPC through UniRPC proxy' }],
    },
    {
      name: 'Debug',
      flags: [
        { flag: FeatureFlags.TraceJsonRpc, label: 'Enables JSON-RPC tracing' },
        { flag: FeatureFlags.AATestWeb, label: 'A/A Test for Web' },
        ...(isE2eTestEnv() ? [{ flag: FeatureFlags.DummyFlagTest, label: 'Dummy Flag Test' } satisfies FlagDef] : []),
      ],
    },
    {
      name: 'V2 Endpoints',
      flags: [{ flag: FeatureFlags.V2EndpointsPortfolio, label: 'Enable V2 Endpoints Portfolio' }],
    },
    {
      name: 'Portfolio',
      flags: [
        { flag: FeatureFlags.PortfolioDefiTab, label: 'Enable Portfolio DeFi Tab' },
        { flag: FeatureFlags.PortfolioPoolsBalances, label: 'Enable Portfolio Pools Balances' },
        { flag: FeatureFlags.SelfReportSpamNFTs, label: 'Report spam NFTs' },
      ],
    },
    {
      name: 'Token Categories',
      flags: [{ flag: FeatureFlags.TokenCategories, label: 'Enable Token Categories' }],
    },
    {
      name: 'Misc',
      flags: [{ flag: FeatureFlags.UnificationCopy, label: 'Enable Unification Copy' }],
    },
    {
      name: 'RWA',
      flags: [
        { flag: FeatureFlags.PermissionedPositions, label: 'Enable permissioned positions in the positions list' },
      ],
    },
    {
      name: 'Experiments',
      flags: [],
      extraItems: [
        {
          name: Experiments.EmbeddedWalletOnboarding,
          searchText: EMBEDDED_WALLET_ONBOARDING_LABEL,
          node: extras.experimentOptions,
        },
      ],
    },
    {
      name: 'Layers',
      flags: [],
      // One item per layer rather than per param: a layer's params are overridden as a set,
      // so matching any of its param names surfaces that whole layer block.
      extraItems: SEARCHABLE_LAYERS.map((layerName) => ({
        name: layerName,
        searchText: LayerProperties[layerName].join(' '),
        node: extras.layerOption(layerName),
      })),
    },
    {
      name: 'Compliance / Geo',
      flags: [],
      extraItems: [{ name: 'Compliance / Geo', node: extras.complianceOverrides }],
    },
  ]

  // Any web flag not placed in a curated group above auto-appears here, so new flags
  // show up in the modal without hand-editing this file. DummyFlagTest stays E2E-only.
  const referenced = new Set(groups.flatMap((group) => group.flags.map(({ flag }) => flag)))
  const uncategorized: FlagDef[] = []
  for (const [flag] of WEB_FEATURE_FLAG_NAMES) {
    if (referenced.has(flag) || (flag === FeatureFlags.DummyFlagTest && !isE2eTestEnv())) {
      continue
    }
    uncategorized.push({ flag })
  }

  if (uncategorized.length > 0) {
    groups.push({ name: 'Uncategorized', flags: uncategorized })
  }

  return groups
}
