/* oxlint-disable typescript/prefer-enum-initializers -- preserve the order */
import { isWebApp } from '@universe/environment'
import { logger } from 'utilities/src/logger/logger'

/**
 * Feature flag names.
 * Add in alphabetical order for each section to decrease probability of merge conflicts.
 */
export enum FeatureFlags {
  // Shared
  AllowUniswapXOnlyRoutesInSwapSettings,
  ArbitrumDutchV3,
  Arc,
  BlockaidFotLogging,
  CentralizedPrices,
  ChainedActions,
  DataLivelinessUI,
  DisableSwap7702,
  DisableSessionsForPlan,
  Earn,
  EmbeddedWallet,
  EnablePermitMismatchUX,
  ForceDisableWalletGetCapabilities,
  ForcePermitTransactions,
  ForSessionsEnabled,
  ForUrlMigration,
  GasFeeOverrides,
  HashcashSolverEnabled,
  RwaGeoblocked,
  Linea,
  MegaETH,
  NetworkFilterV2,
  NoUniswapInterfaceFees,
  PortfolioPoolsBalances,
  PortionFields,
  RWACoinGeckoData,
  RWATdp,
  RWAUX,
  RWAUXExplore,
  RwaUxSearch,
  RandomizeQuotePolling,
  RequestSwapSteps,
  Robinhood,
  SessionsPerformanceTrackingEnabled,
  SessionsServiceEnabled,
  SessionsUpgradeAutoEnabled,
  SmartWallet,
  SmartWalletDisableVideo,
  Tempo,
  TurnstileSolverEnabled,
  TwoSecondSwapQuotePollingInterval,
  UniquoteEnabled,
  UniRpcEnabled,
  UniswapWrapped2025,
  UniswapX,
  UniswapXPriorityOrdersBase,
  UniswapXPriorityOrdersOptimism,
  UniswapXPriorityOrdersUnichain,
  UseUniversalRouterVersion211,
  V2EndpointsPools,
  V2EndpointsPortfolio,
  V2EndpointsPositions,
  V2EndpointsSearch,
  V2EndpointsTokens,
  V2EndpointsTransactions,
  ViemEnabled,
  ViemProviderEnabled,
  XLayer,

  // Wallet
  DisableFiatOnRampKorea,
  Eip5792Methods,
  EnableExportPrivateKeys,
  EnableRestoreSeedPhrase,
  EnableTransactionSpacingForDelegatedAccounts,
  ExpoImage,

  NotificationApiDataSource,
  NotificationOnboardingCard,
  NotificationService,

  Scantastic,
  SelfReportSpamNFTs,
  SmartWalletSettings,
  Support7677GasSponsorship,
  UwULink,

  // Web
  AATestWeb,
  AddLiquidityRevamp,
  BatchedSwaps,
  DummyFlagTest,
  LimitsFees,
  LiquidityBatchedTransactions,
  LpIncentives,
  LpPdpDepthChart,
  LpIncentivesTablesColumn,
  NoUniswapInterfaceFeesNotification,
  PortfolioDefiTab,
  RWATdpRelatedTokens,
  RWATdpSiblings,
  TDPTokenCarousel,
  ToucanAuctionKYC,
  ToucanTickDetailsTooltip,
  TraceJsonRpc,
  UnificationCopy,
  UnirouteEnabled,
  UniversalSwap,
}
/* oxlint-enable typescript/prefer-enum-initializers */

// These names must match the gate name on statsig.
// Add in alphabetical order to decrease probability of merge conflicts.
export const SHARED_FEATURE_FLAG_NAMES = new Map<FeatureFlags, string>([
  [FeatureFlags.AllowUniswapXOnlyRoutesInSwapSettings, 'allow_uniswapx_only_routes_in_swap_settings'],
  [FeatureFlags.Arc, 'arc'],
  [FeatureFlags.BlockaidFotLogging, 'blockaid_fot_logging'],
  [FeatureFlags.CentralizedPrices, 'centralized_prices'],
  [FeatureFlags.ChainedActions, 'enable_chained_actions'],
  [FeatureFlags.DataLivelinessUI, 'data_liveliness_ui'],
  [FeatureFlags.DisableSessionsForPlan, 'disable_sessions_for_plan'],
  [FeatureFlags.DisableSwap7702, 'disable-swap-7702'],
  [FeatureFlags.Earn, 'earn'],
  [FeatureFlags.EmbeddedWallet, 'embedded_wallet'],
  [FeatureFlags.EnablePermitMismatchUX, 'enable_permit2_mismatch_ux'],
  [FeatureFlags.ForSessionsEnabled, 'for_sessions_enabled'],
  [FeatureFlags.ForUrlMigration, 'for_url_migration'],
  [FeatureFlags.ForceDisableWalletGetCapabilities, 'force_disable_wallet_get_capabilities'],
  [FeatureFlags.ForcePermitTransactions, 'force_permit_transactions'],
  [FeatureFlags.GasFeeOverrides, 'gas_fee_overrides'],
  [FeatureFlags.HashcashSolverEnabled, 'sessions_hashcash_solver_enabled'],
  [FeatureFlags.Linea, 'linea'],
  [FeatureFlags.MegaETH, 'megaeth'],
  [FeatureFlags.NetworkFilterV2, 'network_filter_v2'],
  [FeatureFlags.NoUniswapInterfaceFees, 'no_uniswap_interface_fees'],
  [FeatureFlags.NotificationApiDataSource, 'notification_api_data_source'],
  [FeatureFlags.PortfolioPoolsBalances, 'portfolio_pools_balances'],
  [FeatureFlags.PortionFields, 'portion-fields'],
  [FeatureFlags.RWACoinGeckoData, 'rwa_coingecko_data'],
  [FeatureFlags.RWATdp, 'rwa_tdp'],
  [FeatureFlags.RWATdpRelatedTokens, 'rwa_tdp_related_tokens'],
  [FeatureFlags.RWATdpSiblings, 'rwa_tdp_siblings'],
  [FeatureFlags.RWAUX, 'rwa_ux'],
  [FeatureFlags.RWAUXExplore, 'rwa_ux_explore'],
  [FeatureFlags.RandomizeQuotePolling, 'randomize_quote_polling'],
  [FeatureFlags.RequestSwapSteps, 'request_swap_steps'],
  [FeatureFlags.Robinhood, 'robinhood'],
  [FeatureFlags.RwaGeoblocked, 'rwa_geo_blocked'],
  [FeatureFlags.RwaUxSearch, 'rwa_ux_search'],
  [FeatureFlags.SelfReportSpamNFTs, 'self-report-spam-nfts'],
  [FeatureFlags.SessionsPerformanceTrackingEnabled, 'sessions_performance_tracking_enabled'],
  [FeatureFlags.SessionsServiceEnabled, 'sessions_service_enabled'],
  [FeatureFlags.SessionsUpgradeAutoEnabled, 'sessions_upgrade_auto_enabled'],
  [FeatureFlags.SmartWallet, 'smart-wallet'],
  [FeatureFlags.SmartWalletDisableVideo, 'smart_wallet_disable_video'],
  [FeatureFlags.TDPTokenCarousel, 'tdp_token_carousel'],
  [FeatureFlags.Tempo, 'tempo'],
  [FeatureFlags.TurnstileSolverEnabled, 'sessions_turnstile_solver_enabled'],
  [FeatureFlags.TwoSecondSwapQuotePollingInterval, 'two_second_swap_quote_polling_interval'],
  [FeatureFlags.UniRpcEnabled, 'unirpc_enabled'],
  [FeatureFlags.UniquoteEnabled, 'uniquote_enabled'],
  [FeatureFlags.UnirouteEnabled, 'uniroute_rollout'],
  [FeatureFlags.UniswapWrapped2025, 'uniswap_wrapped_2025'],
  [FeatureFlags.UniswapX, 'uniswapx'],
  [FeatureFlags.UseUniversalRouterVersion211, 'use_ur_version_2.1.1'],
  [FeatureFlags.V2EndpointsPools, 'v2_endpoints_pools'],
  [FeatureFlags.V2EndpointsPortfolio, 'v2_endpoints_portfolio'],
  [FeatureFlags.V2EndpointsPositions, 'v2_endpoints_positions'],
  [FeatureFlags.V2EndpointsSearch, 'v2_endpoints_search'],
  [FeatureFlags.V2EndpointsTokens, 'v2_endpoints_tokens'],
  [FeatureFlags.V2EndpointsTransactions, 'v2_endpoints_transactions'],
  [FeatureFlags.ViemEnabled, 'viem_enabled'],
  [FeatureFlags.ViemProviderEnabled, 'viem_provider_enabled'],
  [FeatureFlags.XLayer, 'x_layer'],
])

// These names must match the gate name on statsig.
// Add in alphabetical order to decrease probability of merge conflicts.
export const WEB_FEATURE_FLAG_NAMES = new Map<FeatureFlags, string>([
  ...SHARED_FEATURE_FLAG_NAMES,
  [FeatureFlags.AATestWeb, 'aatest_web'],
  [FeatureFlags.AddLiquidityRevamp, 'add_liquidity_revamp'],
  [FeatureFlags.BatchedSwaps, 'batched_swaps'],
  [FeatureFlags.DummyFlagTest, 'dummy_flag_test'],
  [FeatureFlags.LimitsFees, 'limits_fees'],
  [FeatureFlags.LiquidityBatchedTransactions, 'liquidity_batched_transactions'],
  [FeatureFlags.LpIncentives, 'lp_incentives'],
  [FeatureFlags.LpIncentivesTablesColumn, 'lp_incentives_tables_column'],
  [FeatureFlags.LpPdpDepthChart, 'lp_pdp_depth_chart'],
  [FeatureFlags.NoUniswapInterfaceFeesNotification, 'no_uniswap_interface_fees_notification'],
  [FeatureFlags.PortfolioDefiTab, 'portfolio_defi_tab'],
  [FeatureFlags.Support7677GasSponsorship, 'support_7677_gas_sponsorship'],
  [FeatureFlags.ToucanAuctionKYC, 'toucan_auction_kyc'],
  [FeatureFlags.ToucanTickDetailsTooltip, 'toucan_tick_details_tooltip'],
  [FeatureFlags.TraceJsonRpc, 'traceJsonRpc'],
  [FeatureFlags.UnificationCopy, 'unification_copy'],
  [FeatureFlags.UniversalSwap, 'universal_swap'],
])

// These names must match the gate name on statsig.
// Add in alphabetical order to decrease probability of merge conflicts.
export const WALLET_FEATURE_FLAG_NAMES = new Map<FeatureFlags, string>([
  ...SHARED_FEATURE_FLAG_NAMES,
  [FeatureFlags.DisableFiatOnRampKorea, 'disable-fiat-onramp-korea'],
  [FeatureFlags.Eip5792Methods, 'eip_5792_methods'],
  [FeatureFlags.EnableExportPrivateKeys, 'enable-export-private-keys'],
  [FeatureFlags.EnableRestoreSeedPhrase, 'enable-restore-seed-phrase'],
  [FeatureFlags.EnableTransactionSpacingForDelegatedAccounts, 'enable_transaction_spacing_for_delegated_accounts'],
  [FeatureFlags.ExpoImage, 'expo_image'],

  [FeatureFlags.NotificationOnboardingCard, 'notification_onboarding_card'],
  [FeatureFlags.NotificationService, 'notification_system'],
  [FeatureFlags.Scantastic, 'scantastic'],
  [FeatureFlags.SmartWalletSettings, 'smart_wallet_settings'],
  [FeatureFlags.Support7677GasSponsorship, 'support_7677_gas_sponsorship'],
  [FeatureFlags.UwULink, 'uwu-link'],
])

export enum FeatureFlagClient {
  Web = 0,
  Wallet = 1,
}

const FEATURE_FLAG_NAMES = {
  [FeatureFlagClient.Web]: WEB_FEATURE_FLAG_NAMES,
  [FeatureFlagClient.Wallet]: WALLET_FEATURE_FLAG_NAMES,
}

export function getFeatureFlagName(flag: FeatureFlags, client?: FeatureFlagClient): string {
  const names =
    client !== undefined
      ? FEATURE_FLAG_NAMES[client]
      : isWebApp
        ? FEATURE_FLAG_NAMES[FeatureFlagClient.Web]
        : FEATURE_FLAG_NAMES[FeatureFlagClient.Wallet]
  const name = names.get(flag)
  if (!name) {
    const err = new Error(`Feature ${FeatureFlags[flag]} does not have a name mapped for this application`)

    logger.error(err, {
      tags: {
        file: 'flags.ts',
        function: 'getFeatureFlagName',
      },
    })

    throw err
  }

  return name
}
