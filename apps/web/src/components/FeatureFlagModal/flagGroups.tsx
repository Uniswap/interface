import { isE2eTestEnv } from '@universe/environment'
import { FeatureFlags } from '@universe/gating'
import type { ReactNode } from 'react'

export interface FlagDef {
  flag: FeatureFlags
  label: string
}

export interface FlagGroupDef {
  name: string
  flags: FlagDef[]
  extra?: ReactNode
}

/**
 * Build the static portion of flag groups (no hooks required).
 * Groups that need runtime values (e.g. extension ID) accept them via `extras`.
 */
export function buildFlagGroups(extras: {
  extensionDropdown: ReactNode
  networkRequestsConfig: ReactNode
  layerOptions: ReactNode
  complianceOverrides: ReactNode
}): FlagGroupDef[] {
  return [
    {
      name: 'Sessions',
      flags: [
        { flag: FeatureFlags.SessionsServiceEnabled, label: 'Enable Sessions Service' },
        { flag: FeatureFlags.SessionsUpgradeAutoEnabled, label: 'Enable Sessions Upgrade Auto' },
        { flag: FeatureFlags.HashcashSolverEnabled, label: 'Enable Hashcash Solver' },
        { flag: FeatureFlags.TurnstileSolverEnabled, label: 'Enable Turnstile Solver' },
        { flag: FeatureFlags.SessionsPerformanceTrackingEnabled, label: 'Enable Sessions Performance Tracking' },
      ],
    },
    {
      name: 'FOR API',
      flags: [
        { flag: FeatureFlags.ForSessionsEnabled, label: 'Enable FOR Sessions' },
        { flag: FeatureFlags.ForUrlMigration, label: 'Enable FOR URL Migration' },
      ],
    },
    {
      name: 'XLayer',
      flags: [{ flag: FeatureFlags.XLayer, label: 'Enable XLayer UX' }],
    },
    {
      name: 'Swap Features',
      flags: [
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
        { flag: FeatureFlags.AddLiquidityRevamp, label: 'Enable Add Liquidity Revamp' },
        { flag: FeatureFlags.LpPdpDepthChart, label: 'Enable LP PDP Depth Chart toggle' },
        { flag: FeatureFlags.LiquidityBatchedTransactions, label: 'Enable Batched Transactions for LP flow' },
        { flag: FeatureFlags.LpIncentives, label: 'Enable LP Incentives' },
        { flag: FeatureFlags.LpIncentivesTablesColumn, label: 'Enable LP Reward APR Column' },
      ],
    },
    {
      name: 'Toucan',
      flags: [
        { flag: FeatureFlags.ToucanAuctionKYC, label: 'Enable Toucan Auction KYC' },
        {
          flag: FeatureFlags.ToucanTickDetailsTooltip,
          label: 'Show Remaining (currency required) on chart-bar tooltip',
        },
      ],
    },
    {
      name: 'Embedded Wallet',
      flags: [
        { flag: FeatureFlags.EmbeddedWallet, label: 'Add internal embedded wallet functionality' },
        {
          flag: FeatureFlags.Support7677GasSponsorship,
          label: 'Advertise EIP-7677 paymaster sponsorship in wallet_getCapabilities',
        },
      ],
      extra: extras.extensionDropdown,
    },
    {
      name: 'New Chains',
      flags: [
        { flag: FeatureFlags.Arc, label: 'Enable Arc' },
        { flag: FeatureFlags.Linea, label: 'Enable Linea' },
        { flag: FeatureFlags.MegaETH, label: 'Enable MegaETH' },
        { flag: FeatureFlags.Robinhood, label: 'Enable Robinhood' },
        { flag: FeatureFlags.Tempo, label: 'Enable Tempo' },
      ],
    },
    {
      name: 'Network Requests',
      flags: [],
      extra: extras.networkRequestsConfig,
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
      flags: [
        { flag: FeatureFlags.V2EndpointsTokens, label: 'Enable V2 Endpoints Tokens' },
        { flag: FeatureFlags.V2EndpointsTransactions, label: 'Enable V2 Endpoints Transactions' },
        { flag: FeatureFlags.V2EndpointsPools, label: 'Enable V2 Endpoints Pools' },
        { flag: FeatureFlags.V2EndpointsPositions, label: 'Enable V2 Endpoints Positions' },
        { flag: FeatureFlags.V2EndpointsPortfolio, label: 'Enable V2 Endpoints Portfolio' },
        { flag: FeatureFlags.V2EndpointsSearch, label: 'Enable V2 Endpoints Search' },
      ],
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
      name: 'Token Details Page',
      flags: [{ flag: FeatureFlags.TDPTokenCarousel, label: 'Enable TDP Token Carousel' }],
    },
    {
      name: 'Earn',
      flags: [{ flag: FeatureFlags.Earn, label: 'Enable Earn' }],
    },
    {
      name: 'Misc',
      flags: [
        { flag: FeatureFlags.DataLivelinessUI, label: 'Enable Data Liveliness UI' },
        { flag: FeatureFlags.UniswapWrapped2025, label: 'Enable Uniswap Wrapped 2025' },
        { flag: FeatureFlags.UnificationCopy, label: 'Enable Unification Copy' },
      ],
    },
    {
      name: 'Prices',
      flags: [{ flag: FeatureFlags.CentralizedPrices, label: 'Enable Centralized Prices' }],
    },
    {
      name: 'RWA',
      flags: [
        { flag: FeatureFlags.RwaGeoblocked, label: 'Geo-block RWA tokens (treat region as restricted)' },
        { flag: FeatureFlags.RWACoinGeckoData, label: 'Enable RWA CoinGecko Data' },
        { flag: FeatureFlags.RWATdp, label: 'Enable RWA TDP' },
        { flag: FeatureFlags.RWATdpRelatedTokens, label: 'Enable RWA TDP Related Tokens' },
        { flag: FeatureFlags.RWATdpSiblings, label: 'Enable RWA TDP More Ways to Trade (Siblings)' },
        { flag: FeatureFlags.RWAUX, label: 'Enable RWA UX' },
        { flag: FeatureFlags.RWAUXExplore, label: 'Enable RWA UX Explore (table)' },
        { flag: FeatureFlags.RwaUxSearch, label: 'Enable Stocks in Search' },
      ],
    },
    { name: 'Experiments', flags: [] },
    {
      name: 'Layers',
      flags: [],
      extra: extras.layerOptions,
    },
    {
      name: 'Compliance / Geo',
      flags: [],
      extra: extras.complianceOverrides,
    },
  ]
}
