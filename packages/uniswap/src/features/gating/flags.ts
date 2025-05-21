import { logger } from 'utilities/src/logger/logger'
import { isInterface } from 'utilities/src/platform'

// only disable for this enum
/* eslint-disable @typescript-eslint/prefer-enum-initializers */
/**
 * Feature flag names
 */
export enum FeatureFlags {
  // Shared
  ArbitrumDutchV3,
  BlockaidFotLogging,
  Datadog,
  DisableSwap7702,
  EmbeddedWallet,
  IndicativeSwapQuotes,
  InstantTokenBalanceUpdate,
  MonadTestnet,
  MonadTestnetDown,
  PortionFields,
  SearchRevamp,
  Soneium,
  SwapSettingsV4HooksToggle,
  TwoSecondSwapQuotePollingInterval,
  UniquoteEnabled,
  UniswapX,
  UniswapXPriorityOrdersBase,
  UniswapXPriorityOrdersOptimism,
  UniswapXPriorityOrdersUnichain,
  ServiceBasedSwapTransactionInfo,
  SmartWallet,
  ForcePermitTransactions,
  EnablePermitMismatchUX,
  ViemProviderEnabled,
  ForceDisableWalletGetCapabilities,

  // Wallet
  DisableFiatOnRampKorea,
  EnableTransactionSpacingForDelegatedAccounts,
  NotificationPriceAlertsAndroid,
  NotificationPriceAlertsIOS,
  NotificationOnboardingCard,
  NotificationUnfundedWalletsAndroid,
  NotificationUnfundedWalletsIOS,
  OnboardingKeyring,
  PrivateRpc,
  Scantastic,
  SelfReportSpamNFTs,
  UwULink,
  BlurredLockScreen,
  Eip5792Methods,
  ExecuteTransactionV2,
  RestoreSeedPhrase,

  // Web
  AATestWeb,
  ConversionTracking,
  DummyFlagTest,
  GoogleConversionTracking,
  GqlTokenLists,
  LimitsFees,
  LpIncentives,
  PoolSearch,
  PositionPageV2,
  PriceRangeInputV2,
  TraceJsonRpc,
  TwitterConversionTracking,
  UniversalSwap,
  BatchedSwaps,
}
/* eslint-enable @typescript-eslint/prefer-enum-initializers */

// These names must match the gate name on statsig
export const SHARED_FEATURE_FLAG_NAMES = new Map<FeatureFlags, string>([
  [FeatureFlags.ArbitrumDutchV3, 'uniswapx_dutchv3_orders_arbitrum'],
  [FeatureFlags.BlockaidFotLogging, 'blockaid_fot_logging'],
  [FeatureFlags.Datadog, 'datadog'],
  [FeatureFlags.DisableSwap7702, 'disable-swap-7702'],
  [FeatureFlags.EmbeddedWallet, 'embedded_wallet'],
  [FeatureFlags.EnablePermitMismatchUX, 'enable_permit2_mismatch_ux'],
  [FeatureFlags.ExecuteTransactionV2, 'new_execute_transaction_arch'],
  [FeatureFlags.ForceDisableWalletGetCapabilities, 'force_disable_wallet_get_capabilities'],
  [FeatureFlags.ForcePermitTransactions, 'force_permit_transactions'],
  [FeatureFlags.IndicativeSwapQuotes, 'indicative-quotes'],
  [FeatureFlags.InstantTokenBalanceUpdate, 'instant-token-balance-update'],
  [FeatureFlags.MonadTestnet, 'monad_testnet'],
  [FeatureFlags.PortionFields, 'portion-fields'],
  [FeatureFlags.SearchRevamp, 'search_revamp'],
  [FeatureFlags.ServiceBasedSwapTransactionInfo, 'new_swap_transaction_info_arch'],
  [FeatureFlags.SmartWallet, 'smart-wallet'],
  [FeatureFlags.Soneium, 'soneium'],
  [FeatureFlags.SwapSettingsV4HooksToggle, 'swap_settings_v4_hooks_toggle'],
  [FeatureFlags.TwoSecondSwapQuotePollingInterval, 'two_second_swap_quote_polling_interval'],
  [FeatureFlags.UniquoteEnabled, 'uniquote_enabled'],
  [FeatureFlags.UniswapX, 'uniswapx'],
  [FeatureFlags.UniswapXPriorityOrdersBase, 'uniswapx_priority_orders_base'],
  [FeatureFlags.UniswapXPriorityOrdersOptimism, 'uniswapx_priority_orders_optimism'],
  [FeatureFlags.UniswapXPriorityOrdersUnichain, 'uniswapx_priority_orders_unichain'],
  [FeatureFlags.ViemProviderEnabled, 'viem_provider_enabled'],
])

// These names must match the gate name on statsig
export const WEB_FEATURE_FLAG_NAMES = new Map<FeatureFlags, string>([
  ...SHARED_FEATURE_FLAG_NAMES,
  [FeatureFlags.AATestWeb, 'aatest_web'],
  [FeatureFlags.BatchedSwaps, 'batched_swaps'],
  [FeatureFlags.ConversionTracking, 'conversion-tracking'],
  [FeatureFlags.DummyFlagTest, 'dummy_flag_test'],
  [FeatureFlags.GoogleConversionTracking, 'google_conversion_tracking'],
  [FeatureFlags.GqlTokenLists, 'gql_token_lists'],
  [FeatureFlags.LimitsFees, 'limits_fees'],
  [FeatureFlags.LpIncentives, 'lp_incentives'],
  [FeatureFlags.MonadTestnetDown, 'monad_down'],
  [FeatureFlags.PoolSearch, 'pool_search'],
  [FeatureFlags.PositionPageV2, 'position_page_v2'],
  [FeatureFlags.PriceRangeInputV2, 'price_range_input_v2'],
  [FeatureFlags.TraceJsonRpc, 'traceJsonRpc'],
  [FeatureFlags.TwitterConversionTracking, 'twitter_conversion_tracking'],
  [FeatureFlags.UniversalSwap, 'universal_swap'],
])

// These names must match the gate name on statsig
export const WALLET_FEATURE_FLAG_NAMES = new Map<FeatureFlags, string>([
  ...SHARED_FEATURE_FLAG_NAMES,
  [FeatureFlags.BlurredLockScreen, 'blurred_lock_screen'],
  [FeatureFlags.DisableFiatOnRampKorea, 'disable-fiat-onramp-korea'],
  [FeatureFlags.Eip5792Methods, 'eip_5792_methods'],
  [FeatureFlags.EnableTransactionSpacingForDelegatedAccounts, 'enable_transaction_spacing_for_delegated_accounts'],
  [FeatureFlags.NotificationOnboardingCard, 'notification_onboarding_card'],
  [FeatureFlags.NotificationPriceAlertsAndroid, 'notification_price_alerts_android'],
  [FeatureFlags.NotificationPriceAlertsIOS, 'notification_price_alerts_ios'],
  [FeatureFlags.NotificationUnfundedWalletsAndroid, 'notification_unfunded_wallet_android'],
  [FeatureFlags.NotificationUnfundedWalletsIOS, 'notification_unfunded_wallet_ios'],
  [FeatureFlags.OnboardingKeyring, 'onboarding-keyring'],
  [FeatureFlags.PrivateRpc, 'mev-blocker'],
  [FeatureFlags.RestoreSeedPhrase, 'restore-seed-phrase'],
  [FeatureFlags.Scantastic, 'scantastic'],
  [FeatureFlags.SelfReportSpamNFTs, 'self-report-spam-nfts'],
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
      : isInterface
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
