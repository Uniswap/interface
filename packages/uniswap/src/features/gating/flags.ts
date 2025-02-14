import { logger } from 'utilities/src/logger/logger'
import { isInterface } from 'utilities/src/platform'
/**
 * Feature flag names
 */
export enum FeatureFlags {
  // Shared
  Datadog,
  EmbeddedWallet,
  ForAggregator,
  IndicativeSwapQuotes,
  InstantTokenBalanceUpdate,
  MonadTestnet,
  PortionFields,
  SharedSwapArbitrumUniswapXExperiment,
  TokenSelectorTrendingTokens,
  TwoSecondSwapQuotePollingInterval,
  Unichain,
  UnichainPromo,
  UniswapX,
  V4Swap,
  UniswapXPriorityOrdersBase,
  UniswapXPriorityOrdersOptimism,
  UniswapXPriorityOrdersUnichain,
  BlockaidFotLogging,

  // Wallet
  DisableFiatOnRampKorea,
  ExtensionAppRating,
  ExtensionAutoConnect,
  ExtensionClaimUnitag,
  ExtensionPromotionGA,
  FiatOffRamp,
  NotificationPriceAlertsAndroid,
  NotificationPriceAlertsIOS,
  NotificationOnboardingCard,
  NotificationUnfundedWalletsAndroid,
  NotificationUnfundedWalletsIOS,
  OnboardingKeyring,
  OpenAIAssistant,
  PrivateRpc,
  Scantastic,
  SelfReportSpamNFTs,
  TransactionDetailsSheet,
  UnitagsDeviceAttestation,
  UwULink,
  BlurredLockScreen,
  TokenSelectorFlashList,

  // Web
  AATestWeb,
  ConversionTracking,
  Eip6936Enabled,
  GoogleConversionTracking,
  GqlTokenLists,
  L2NFTs,
  LimitsFees,
  LPRedesign,
  MigrateV3ToV4,
  MultipleRoutingOptions,
  NavigationHotkeys,
  PriceRangeInputV2,
  QuickRouteMainnet,
  Realtime,
  TraceJsonRpc,
  TwitterConversionTracking,
  UniswapXSyntheticQuote,
  UniswapXv2,
  UniversalSwap,
  V4Data,
  Zora,
}

// These names must match the gate name on statsig
export const SHARED_FEATURE_FLAG_NAMES = new Map<FeatureFlags, string>([
  [FeatureFlags.BlockaidFotLogging, 'blockaid_fot_logging'],
  [FeatureFlags.Datadog, 'datadog'],
  [FeatureFlags.EmbeddedWallet, 'embedded_wallet'],
  [FeatureFlags.IndicativeSwapQuotes, 'indicative-quotes'],
  [FeatureFlags.InstantTokenBalanceUpdate, 'instant-token-balance-update'],
  [FeatureFlags.MonadTestnet, 'monad_testnet'],
  [FeatureFlags.PortionFields, 'portion-fields'],
  [FeatureFlags.SharedSwapArbitrumUniswapXExperiment, 'shared_swap_arbitrum_uniswapx_experiment'],
  [FeatureFlags.TokenSelectorTrendingTokens, 'token_selector_trending_tokens'],
  [FeatureFlags.TwoSecondSwapQuotePollingInterval, 'two_second_swap_quote_polling_interval'],
  [FeatureFlags.Unichain, 'unichain'],
  [FeatureFlags.UnichainPromo, 'unichain_promo'],
  [FeatureFlags.UniswapX, 'uniswapx'],
  [FeatureFlags.UniswapXPriorityOrdersBase, 'uniswapx_priority_orders_base'],
  [FeatureFlags.UniswapXPriorityOrdersOptimism, 'uniswapx_priority_orders_optimism'],
  [FeatureFlags.UniswapXPriorityOrdersUnichain, 'uniswapx_priority_orders_unichain'],
  [FeatureFlags.V4Swap, 'v4_swap'],
])

// These names must match the gate name on statsig
export const WEB_FEATURE_FLAG_NAMES = new Map<FeatureFlags, string>([
  ...SHARED_FEATURE_FLAG_NAMES,
  [FeatureFlags.AATestWeb, 'aatest_web'],
  [FeatureFlags.ConversionTracking, 'conversion-tracking'],
  [FeatureFlags.Eip6936Enabled, 'eip6963_enabled'],
  [FeatureFlags.ForAggregator, 'for_aggregator_web'],
  [FeatureFlags.GoogleConversionTracking, 'google_conversion_tracking'],
  [FeatureFlags.GqlTokenLists, 'gql_token_lists'],
  [FeatureFlags.L2NFTs, 'l2_nfts'],
  [FeatureFlags.LPRedesign, 'lp_redesign'],
  [FeatureFlags.LimitsFees, 'limits_fees'],
  [FeatureFlags.MigrateV3ToV4, 'migrate-v3-to-v4'],
  [FeatureFlags.MultipleRoutingOptions, 'multiple_routing_options'],
  [FeatureFlags.NavigationHotkeys, 'navigation_hotkeys'],

  [FeatureFlags.PriceRangeInputV2, 'price_range_input_v2'],
  [FeatureFlags.QuickRouteMainnet, 'enable_quick_route_mainnet'],
  [FeatureFlags.Realtime, 'realtime'],
  [FeatureFlags.TraceJsonRpc, 'traceJsonRpc'],
  [FeatureFlags.TwitterConversionTracking, 'twitter_conversion_tracking'],
  [FeatureFlags.UniswapXSyntheticQuote, 'uniswapx_synthetic_quote'],
  [FeatureFlags.UniswapXv2, 'uniswapx_v2'],
  [FeatureFlags.UniversalSwap, 'universal_swap'],
  [FeatureFlags.V4Data, 'v4_data'],
  [FeatureFlags.Zora, 'zora'],
])

// These names must match the gate name on statsig
export const WALLET_FEATURE_FLAG_NAMES = new Map<FeatureFlags, string>([
  ...SHARED_FEATURE_FLAG_NAMES,
  [FeatureFlags.BlurredLockScreen, 'blurred_lock_screen'],
  [FeatureFlags.DisableFiatOnRampKorea, 'disable-fiat-onramp-korea'],
  [FeatureFlags.ExtensionAppRating, 'extension_app_rating'],
  [FeatureFlags.ExtensionAutoConnect, 'extension-auto-connect'],
  [FeatureFlags.ExtensionClaimUnitag, 'extension-claim-unitag'],
  [FeatureFlags.ExtensionPromotionGA, 'extension-promotion-ga'],
  [FeatureFlags.FiatOffRamp, 'fiat-offramp'],
  [FeatureFlags.ForAggregator, 'for-aggregator'],
  [FeatureFlags.NotificationOnboardingCard, 'notification_onboarding_card'],
  [FeatureFlags.NotificationPriceAlertsAndroid, 'notification_price_alerts_android'],
  [FeatureFlags.NotificationPriceAlertsIOS, 'notification_price_alerts_ios'],
  [FeatureFlags.NotificationUnfundedWalletsAndroid, 'notification_unfunded_wallet_android'],
  [FeatureFlags.NotificationUnfundedWalletsIOS, 'notification_unfunded_wallet_ios'],
  [FeatureFlags.OnboardingKeyring, 'onboarding-keyring'],
  [FeatureFlags.OpenAIAssistant, 'openai-assistant'],
  [FeatureFlags.PrivateRpc, 'mev-blocker'],
  [FeatureFlags.Scantastic, 'scantastic'],
  [FeatureFlags.SelfReportSpamNFTs, 'self-report-spam-nfts'],
  [FeatureFlags.TokenSelectorFlashList, 'token_selector_flashlist'],
  [FeatureFlags.TransactionDetailsSheet, 'transaction-details-sheet'],
  [FeatureFlags.UnitagsDeviceAttestation, 'unitags-device-attestation'],
  [FeatureFlags.UwULink, 'uwu-link'],
])

export enum FeatureFlagClient {
  Web,
  Wallet,
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
