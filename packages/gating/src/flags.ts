import { logger } from 'utilities/src/logger/logger'
import { isWebApp } from 'utilities/src/platform'

// only disable for this enum
/**
 * Feature flag names.
 * Add in alphabetical order for each section to decrease probability of merge conflicts.
 */
/* biome-ignore-start lint/style/useEnumInitializers: preserve the order */
export enum FeatureFlags {
  // Shared
  AllowUniswapXOnlyRoutesInSwapSettings,
  ArbitrumDutchV3,
  BlockaidFotLogging,
  BridgedAssetsBannerV2,
  ChainedActions,
  DisableSwap7702,
  EmbeddedWallet,
  EnablePermitMismatchUX,
  EthAsErc20UniswapX,
  FiatOffRamp,
  ForceDisableWalletGetCapabilities,
  ForcePermitTransactions,
  Monad,
  NoUniswapInterfaceFees,
  PortionFields,
  ServiceBasedSwapTransactionInfo,
  SessionsServiceEnabled,
  SessionsUpgradeAutoEnabled,
  SmartWallet,
  SmartWalletDisableVideo,
  Solana,
  Soneium,
  TwoSecondSwapQuotePollingInterval,
  UnichainFlashblocks,
  UniquoteEnabled,
  UniswapWrapped2025,
  UniswapX,
  UniswapXPriorityOrdersBase,
  UniswapXPriorityOrdersOptimism,
  UniswapXPriorityOrdersUnichain,
  ViemProviderEnabled,
  ViewExternalWalletsOnWeb,
  DisableAztecToken,

  // Wallet
  BlockaidTransactionScanning,
  BlurredLockScreen,
  BottomTabs,
  BridgedAssetsBanner,
  DisableFiatOnRampKorea,
  Eip5792Methods,
  EnableExportPrivateKeys,
  EnableRestoreSeedPhrase,
  EnableTransactionSpacingForDelegatedAccounts,
  MonadAnnouncement,
  NotificationOnboardingCard,
  OnboardingKeyring,
  PrivateRpc,
  Scantastic,
  SelfReportSpamNFTs,
  SmartWalletSettings,
  TradingApiSwapConfirmation,
  UwULink,

  // Web
  AATestWeb,
  BatchedSwaps,
  ClaimRewardsLiquidityApi,
  ConversionApiMigration,
  ConversionTracking,
  D3LiquidityRangeChart,
  DisableExtensionDeeplinks,
  DummyFlagTest,
  GoogleConversionTracking,
  GqlTokenLists,
  LimitsFees,
  LpIncentives,
  MigrateLiquidityApi,
  MigrateV2,
  NotificationApiDataSource,
  NotificationService,
  PoolInfoEndpoint,
  PoolSearch,
  PortfolioDefiTab,
  PortfolioPage,
  PortfolioTokensAllocationChart,
  PortoWalletConnector,
  PriceRangeInputV2,
  SolanaPromo,
  Toucan,
  TraceJsonRpc,
  TwitterConversionTracking,
  UnificationCopy,
  UnirouteEnabled,
  UniversalSwap,
}
/* biome-ignore-end lint/style/useEnumInitializers: preserve the order */

// These names must match the gate name on statsig.
// Add in alphabetical order to decrease probability of merge conflicts.
export const SHARED_FEATURE_FLAG_NAMES = new Map<FeatureFlags, string>([
  [FeatureFlags.AllowUniswapXOnlyRoutesInSwapSettings, 'allow_uniswapx_only_routes_in_swap_settings'],
  [FeatureFlags.ArbitrumDutchV3, 'uniswapx_dutchv3_orders_arbitrum'],
  [FeatureFlags.BlockaidFotLogging, 'blockaid_fot_logging'],
  [FeatureFlags.BridgedAssetsBannerV2, 'bridged_assets_banner_v2'],
  [FeatureFlags.ChainedActions, 'enable_chained_actions'],
  [FeatureFlags.DisableSwap7702, 'disable-swap-7702'],
  [FeatureFlags.EmbeddedWallet, 'embedded_wallet'],
  [FeatureFlags.EnablePermitMismatchUX, 'enable_permit2_mismatch_ux'],
  [FeatureFlags.DisableAztecToken, 'disable_aztec_token'],
  [FeatureFlags.EthAsErc20UniswapX, 'eth_as_erc20_uniswapx'],
  [FeatureFlags.FiatOffRamp, 'fiat_offramp_web'],
  [FeatureFlags.ForceDisableWalletGetCapabilities, 'force_disable_wallet_get_capabilities'],
  [FeatureFlags.ForcePermitTransactions, 'force_permit_transactions'],
  [FeatureFlags.Monad, 'monad'],
  [FeatureFlags.NoUniswapInterfaceFees, 'no_uniswap_interface_fees'],
  [FeatureFlags.NotificationApiDataSource, 'notification_api_data_source'],
  [FeatureFlags.PortionFields, 'portion-fields'],
  [FeatureFlags.SelfReportSpamNFTs, 'self-report-spam-nfts'],
  [FeatureFlags.ServiceBasedSwapTransactionInfo, 'new_swap_transaction_info_arch'],
  [FeatureFlags.SessionsServiceEnabled, 'sessions_service_enabled'],
  [FeatureFlags.SessionsUpgradeAutoEnabled, 'sessions_upgrade_auto_enabled'],
  [FeatureFlags.SmartWallet, 'smart-wallet'],
  [FeatureFlags.SmartWalletDisableVideo, 'smart_wallet_disable_video'],
  [FeatureFlags.Solana, 'solana'],
  [FeatureFlags.Soneium, 'soneium'],
  [FeatureFlags.TradingApiSwapConfirmation, 'trading_api_swap_confirmation'],
  [FeatureFlags.TwoSecondSwapQuotePollingInterval, 'two_second_swap_quote_polling_interval'],
  [FeatureFlags.UnichainFlashblocks, 'unichain_flashblocks'],
  [FeatureFlags.UniquoteEnabled, 'uniquote_enabled'],
  [FeatureFlags.UnirouteEnabled, 'uniroute_rollout'],
  [FeatureFlags.UniswapWrapped2025, 'uniswap_wrapped_2025'],
  [FeatureFlags.UniswapX, 'uniswapx'],
  [FeatureFlags.UniswapXPriorityOrdersBase, 'uniswapx_priority_orders_base'],
  [FeatureFlags.UniswapXPriorityOrdersOptimism, 'uniswapx_priority_orders_optimism'],
  [FeatureFlags.UniswapXPriorityOrdersUnichain, 'uniswapx_priority_orders_unichain'],
  [FeatureFlags.ViemProviderEnabled, 'viem_provider_enabled'],
  [FeatureFlags.ViewExternalWalletsOnWeb, 'view_external_wallets_on_web'],
])

// These names must match the gate name on statsig.
// Add in alphabetical order to decrease probability of merge conflicts.
export const WEB_FEATURE_FLAG_NAMES = new Map<FeatureFlags, string>([
  ...SHARED_FEATURE_FLAG_NAMES,
  [FeatureFlags.AATestWeb, 'aatest_web'],
  [FeatureFlags.BatchedSwaps, 'batched_swaps'],
  [FeatureFlags.ClaimRewardsLiquidityApi, 'claim_rewards_liquidity_api'],
  [FeatureFlags.ConversionApiMigration, 'conversion_api_migration'],
  [FeatureFlags.ConversionTracking, 'conversion-tracking'],
  [FeatureFlags.D3LiquidityRangeChart, 'd3_liquidity_range_chart'],
  [FeatureFlags.DisableExtensionDeeplinks, 'disable_extension_deeplinks'],
  [FeatureFlags.DummyFlagTest, 'dummy_flag_test'],
  [FeatureFlags.GoogleConversionTracking, 'google_conversion_tracking'],
  [FeatureFlags.GqlTokenLists, 'gql_token_lists'],
  [FeatureFlags.LimitsFees, 'limits_fees'],
  [FeatureFlags.LpIncentives, 'lp_incentives'],
  [FeatureFlags.MigrateLiquidityApi, 'migrate_liquidity_api'],
  [FeatureFlags.MigrateV2, 'migrate_v2'],
  [FeatureFlags.NotificationApiDataSource, 'notification_api_data_source'],
  [FeatureFlags.NotificationService, 'notification_system'],
  [FeatureFlags.PoolInfoEndpoint, 'pool_info_endpoint'],
  [FeatureFlags.PoolSearch, 'pool_search'],
  [FeatureFlags.PortfolioDefiTab, 'portfolio_defi_tab'],
  [FeatureFlags.PortfolioPage, 'portfolio_page'],
  [FeatureFlags.PortfolioTokensAllocationChart, 'portfolio_tokens_allocation_chart'],
  [FeatureFlags.PortoWalletConnector, 'porto_wallet_connector'],
  [FeatureFlags.PriceRangeInputV2, 'price_range_input_v2'],
  [FeatureFlags.SolanaPromo, 'solana_promo'],
  [FeatureFlags.Toucan, 'toucan'],
  [FeatureFlags.TraceJsonRpc, 'traceJsonRpc'],
  [FeatureFlags.TwitterConversionTracking, 'twitter_conversion_tracking'],
  [FeatureFlags.UnichainFlashblocks, 'unichain_flashblocks'],
  [FeatureFlags.UnificationCopy, 'unification_copy'],
  [FeatureFlags.UniversalSwap, 'universal_swap'],
])

// These names must match the gate name on statsig.
// Add in alphabetical order to decrease probability of merge conflicts.
export const WALLET_FEATURE_FLAG_NAMES = new Map<FeatureFlags, string>([
  ...SHARED_FEATURE_FLAG_NAMES,
  [FeatureFlags.BlockaidTransactionScanning, 'blockaid_transaction_scanning'],
  [FeatureFlags.BlurredLockScreen, 'blurred_lock_screen'],
  [FeatureFlags.BottomTabs, 'bottom_tabs'],
  [FeatureFlags.BridgedAssetsBanner, 'bridged_assets_banner'],
  [FeatureFlags.DisableFiatOnRampKorea, 'disable-fiat-onramp-korea'],
  [FeatureFlags.Eip5792Methods, 'eip_5792_methods'],
  [FeatureFlags.EnableExportPrivateKeys, 'enable-export-private-keys'],
  [FeatureFlags.EnableRestoreSeedPhrase, 'enable-restore-seed-phrase'],
  [FeatureFlags.EnableTransactionSpacingForDelegatedAccounts, 'enable_transaction_spacing_for_delegated_accounts'],
  [FeatureFlags.MonadAnnouncement, 'monad_announcement'],
  [FeatureFlags.NotificationOnboardingCard, 'notification_onboarding_card'],
  [FeatureFlags.NotificationService, 'notification_system'],
  [FeatureFlags.OnboardingKeyring, 'onboarding-keyring'],
  [FeatureFlags.PrivateRpc, 'mev-blocker'],
  [FeatureFlags.Scantastic, 'scantastic'],
  [FeatureFlags.SmartWalletSettings, 'smart_wallet_settings'],
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
