import { FeatureFlags } from '@universe/gating'
import type { ReactNode } from 'react'
import { isPlaywrightEnv } from 'utilities/src/environment/env'

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
      name: 'Monad',
      flags: [{ flag: FeatureFlags.Monad, label: 'Enable Monad UX' }],
    },
    {
      name: 'XLayer',
      flags: [{ flag: FeatureFlags.XLayer, label: 'Enable XLayer UX' }],
    },
    {
      name: 'Solana',
      flags: [
        { flag: FeatureFlags.Solana, label: 'Enable Solana UX' },
        { flag: FeatureFlags.SolanaPromo, label: 'Turn on Solana promo banners' },
      ],
    },
    {
      name: 'Multichain Token UX Improvements',
      flags: [{ flag: FeatureFlags.MultichainTokenUx, label: 'Enable Updated Multichain Token UX' }],
    },
    {
      name: 'Swap Features',
      flags: [
        { flag: FeatureFlags.NoUniswapInterfaceFees, label: 'Turn off Uniswap interface fees' },
        { flag: FeatureFlags.ChainedActions, label: 'Enable Chained Actions' },
        { flag: FeatureFlags.BatchedSwaps, label: 'Enable Batched Swaps' },
        { flag: FeatureFlags.UniquoteEnabled, label: 'Enable Uniquote' },
        { flag: FeatureFlags.UnirouteEnabled, label: 'Enable Uniroute' },
        { flag: FeatureFlags.UseUniversalRouterVersion211, label: 'Use Universal Router v2.1.1' },
        { flag: FeatureFlags.ViemProviderEnabled, label: 'Enable Viem Provider' },
        { flag: FeatureFlags.LimitsFees, label: 'Enable Limits fees' },
        { flag: FeatureFlags.EnablePermitMismatchUX, label: 'Enable Permit2 mismatch detection' },
        { flag: FeatureFlags.NetworkFilterV2, label: 'Enable Network Filter V2' },
        { flag: FeatureFlags.GasServiceV2, label: 'Enable Gas Service V2' },
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
      flags: [
        { flag: FeatureFlags.UniswapX, label: 'Enable UniswapX' },
        { flag: FeatureFlags.UniswapXPriorityOrdersBase, label: 'UniswapX Priority Orders (on Base)' },
        { flag: FeatureFlags.UniswapXPriorityOrdersUnichain, label: 'UniswapX Priority Orders (on Unichain)' },
        { flag: FeatureFlags.ArbitrumDutchV3, label: 'Enable Dutch V3 on Arbitrum' },
      ],
    },
    {
      name: 'LP',
      flags: [
        { flag: FeatureFlags.LpPdpD3RangeChart, label: 'Enable LP PDP D3 Range Chart' },
        { flag: FeatureFlags.LpPdpDepthChart, label: 'Enable LP PDP Depth Chart toggle' },
        { flag: FeatureFlags.LiquidityBatchedTransactions, label: 'Enable Batched Transactions for LP flow' },
        { flag: FeatureFlags.LpIncentives, label: 'Enable LP Incentives' },
      ],
    },
    {
      name: 'Toucan',
      flags: [
        { flag: FeatureFlags.ToucanAuctionKYC, label: 'Enable Toucan Auction KYC' },
        { flag: FeatureFlags.ToucanLaunchAuction, label: 'Enable Toucan Launch Auction' },
        { flag: FeatureFlags.AuctionDetailsV2, label: 'Enable Auction Details V2' },
        {
          flag: FeatureFlags.AuctionDetailsV2ActivityOnEnded,
          label: 'Show auction activity on ended auctions in Auction Details V2',
        },
      ],
    },
    {
      name: 'Embedded Wallet',
      flags: [{ flag: FeatureFlags.EmbeddedWallet, label: 'Add internal embedded wallet functionality' }],
      extra: extras.extensionDropdown,
    },
    {
      name: 'New Chains',
      flags: [
        { flag: FeatureFlags.Linea, label: 'Enable Linea' },
        { flag: FeatureFlags.Soneium, label: 'Enable Soneium' },
        { flag: FeatureFlags.Tempo, label: 'Enable Tempo' },
      ],
    },
    {
      name: 'Network Requests',
      flags: [],
      extra: extras.networkRequestsConfig,
    },
    {
      name: 'Debug',
      flags: [
        { flag: FeatureFlags.TraceJsonRpc, label: 'Enables JSON-RPC tracing' },
        { flag: FeatureFlags.AATestWeb, label: 'A/A Test for Web' },
        ...(isPlaywrightEnv()
          ? [{ flag: FeatureFlags.DummyFlagTest, label: 'Dummy Flag Test' } satisfies FlagDef]
          : []),
      ],
    },
    {
      name: 'Portfolio',
      flags: [
        { flag: FeatureFlags.PortfolioDefiTab, label: 'Enable Portfolio DeFi Tab' },
        { flag: FeatureFlags.PortfolioPoolsBalances, label: 'Enable Portfolio Pools Balances' },
        { flag: FeatureFlags.ProfitLoss, label: 'Enable Profit/Loss' },
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
        { flag: FeatureFlags.UniswapWrapped2025, label: 'Enable Uniswap Wrapped 2025' },
        { flag: FeatureFlags.UnificationCopy, label: 'Enable Unification Copy' },
      ],
    },
    {
      name: 'Prices',
      flags: [
        { flag: FeatureFlags.CentralizedPrices, label: 'Enable Centralized Prices' },
        { flag: FeatureFlags.CentralizedPricesWs, label: 'Enable Centralized Prices WebSocket' },
      ],
    },
    { name: 'Experiments', flags: [] },
    {
      name: 'Layers',
      flags: [],
      extra: extras.layerOptions,
    },
  ]
}
