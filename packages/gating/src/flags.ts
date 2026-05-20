import { isWebApp } from '@universe/environment'
import { logger } from 'utilities/src/logger/logger'

// only disable for this enum
/**
 * Feature flag names.
 * Add in alphabetical order for each section to decrease probability of merge conflicts.
 */
/* oxlint-disable typescript/prefer-enum-initializers -- preserve the order */
export enum FeatureFlags {
  // Shared
  AllowUniswapXOnlyRoutesInSwapSettings,
  ArbitrumDutchV3,
  BlockaidFotLogging,
  CentralizedPrices,
  ChainedActions,
  DisableSwap7702,
  DisableSessionsForPlan,
  Earn,
  EmbeddedWallet,
  EnablePermitMismatchUX,
  ForceDisableWalletGetCapabilities,
  ForcePermitTransactions,
  ForSessionsEnabled,
  ForUrlMigration,
  HashcashSolverEnabled,
  Linea,
  MultichainTokenUx,
  NetworkFilterV2,
  NoUniswapInterfaceFees,
  PortfolioPoolsBalances,
  PortionFields,
  ProfitLoss,
  RandomizeQuotePolling,
  SessionsPerformanceTrackingEnabled,
  SessionsServiceEnabled,
  SessionsUpgradeAutoEnabled,
  SmartWallet,
  SmartWalletDisableVideo,
  Solana,
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

  PrivateRpc,
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
  NoUniswapInterfaceFeesNotification,
  PortfolioDefiTab,
  SolanaPromo,
  TDPTokenCarousel,
  ToucanAuctionKYC,
  ToucanLaunchAuction,
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
  [FeatureFlags.ArbitrumDutchV3, 'uniswapx_dutchv3_orders_arbitrum'],
  [FeatureFlags.BlockaidFotLogging, 'blockaid_fot_logging'],
  [FeatureFlags.CentralizedPrices, 'centralized_prices'],
  [FeatureFlags.ChainedActions, 'enable_chained_actions'],
  [FeatureFlags.DisableSessionsForPlan, 'disable_sessions_for_plan'],
  [FeatureFlags.DisableSwap7702, 'disable-swap-7702'],
  [FeatureFlags.Earn, 'earn'],
  [FeatureFlags.EmbeddedWallet, 'embedded_wallet'],
  [FeatureFlags.EnablePermitMismatchUX, 'enable_permit2_mismatch_ux'],
  [FeatureFlags.ForSessionsEnabled, 'for_sessions_enabled'],
  [FeatureFlags.ForUrlMigration, 'for_url_migration'],
  [FeatureFlags.ForceDisableWalletGetCapabilities, 'force_disable_wallet_get_capabilities'],
  [FeatureFlags.ForcePermitTransactions, 'force_permit_transactions'],
  [FeatureFlags.HashcashSolverEnabled, 'sessions_hashcash_solver_enabled'],
  [FeatureFlags.Linea, 'linea'],
  [FeatureFlags.MultichainTokenUx, 'multichain_token_ux'],
  [FeatureFlags.NetworkFilterV2, 'network_filter_v2'],
  [FeatureFlags.NoUniswapInterfaceFees, 'no_uniswap_interface_fees'],
  [FeatureFlags.NotificationApiDataSource, 'notification_api_data_source'],
  [FeatureFlags.PortfolioPoolsBalances, 'portfolio_pools_balances'],
  [FeatureFlags.PortionFields, 'portion-fields'],
  [FeatureFlags.ProfitLoss, 'profit_loss'],
  [FeatureFlags.RandomizeQuotePolling, 'randomize_quote_polling'],
  [FeatureFlags.SelfReportSpamNFTs, 'self-report-spam-nfts'],
  [FeatureFlags.SessionsPerformanceTrackingEnabled, 'sessions_performance_tracking_enabled'],
  [FeatureFlags.SessionsServiceEnabled, 'sessions_service_enabled'],
  [FeatureFlags.SessionsUpgradeAutoEnabled, 'sessions_upgrade_auto_enabled'],
  [FeatureFlags.SmartWallet, 'smart-wallet'],
  [FeatureFlags.SmartWalletDisableVideo, 'smart_wallet_disable_video'],
  [FeatureFlags.Solana, 'solana'],
  [FeatureFlags.Tempo, 'tempo'],
  [FeatureFlags.TurnstileSolverEnabled, 'sessions_turnstile_solver_enabled'],
  [FeatureFlags.TwoSecondSwapQuotePollingInterval, 'two_second_swap_quote_polling_interval'],
  [FeatureFlags.UniRpcEnabled, 'unirpc_enabled'],
  [FeatureFlags.UniquoteEnabled, 'uniquote_enabled'],
  [FeatureFlags.UnirouteEnabled, 'uniroute_rollout'],
  [FeatureFlags.UniswapWrapped2025, 'uniswap_wrapped_2025'],
  [FeatureFlags.UniswapX, 'uniswapx'],
  [FeatureFlags.UniswapXPriorityOrdersBase, 'uniswapx_priority_orders_base'],
  [FeatureFlags.UniswapXPriorityOrdersOptimism, 'uniswapx_priority_orders_optimism'],
  [FeatureFlags.UniswapXPriorityOrdersUnichain, 'uniswapx_priority_orders_unichain'],
  [FeatureFlags.UseUniversalRouterVersion211, 'use_ur_version_2.1.1'],
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
  [FeatureFlags.LpPdpDepthChart, 'lp_pdp_depth_chart'],
  [FeatureFlags.NoUniswapInterfaceFeesNotification, 'no_uniswap_interface_fees_notification'],
  [FeatureFlags.PortfolioDefiTab, 'portfolio_defi_tab'],
  [FeatureFlags.SolanaPromo, 'solana_promo'],
  [FeatureFlags.TDPTokenCarousel, 'tdp_token_carousel'],
  [FeatureFlags.ToucanAuctionKYC, 'toucan_auction_kyc'],
  [FeatureFlags.ToucanLaunchAuction, 'toucan_launch_auction'],
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
  [FeatureFlags.PrivateRpc, 'mev-blocker'],
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
