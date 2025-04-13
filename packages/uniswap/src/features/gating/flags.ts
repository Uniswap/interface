import { logger } from 'utilities/src/logger/logger'
import { isInterface } from 'utilities/src/platform'

// only disable for this enum
/* eslint-disable @typescript-eslint/prefer-enum-initializers */
/**
 * Feature flag names
 */
export enum FeatureFlags {
  // Shared
  BlockaidFotLogging,
  Datadog,
  EmbeddedWallet,
  IndicativeSwapQuotes,
  InstantTokenBalanceUpdate,
  MonadTestnet,
  MonadTestnetDown,
  PortionFields,
  SearchRevamp,
  SharedSwapArbitrumUniswapXExperiment,
  Soneium,
  TokenSelectorTrendingTokens,
  TwoSecondSwapQuotePollingInterval,
  UniswapX,
  V4Swap,
  UniswapXPriorityOrdersBase,
  UniswapXPriorityOrdersOptimism,
  UniswapXPriorityOrdersUnichain,

  // Wallet
  DisableFiatOnRampKorea,
  ExtensionAutoConnect,
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
  UwULink,
  BlurredLockScreen,

  // Web
  AATestWeb,
  ConversionTracking,
  Eip6936Enabled,
  GoogleConversionTracking,
  GqlTokenLists,
  L2NFTs,
  LimitsFees,
  MigrateV3ToV4,
  MultipleRoutingOptions,
  NavigationHotkeys,
  PositionPageV2,
  PriceRangeInputV2,
  QuickRouteMainnet,
  TraceJsonRpc,
  TwitterConversionTracking,
  UniswapXSyntheticQuote,
  UniswapXv2,
  UniversalSwap,
  V4Data,
}
/* eslint-enable @typescript-eslint/prefer-enum-initializers */

// These names must match the gate name on statsig
export const SHARED_FEATURE_FLAG_NAMES = new Map<FeatureFlags, string>([
  [FeatureFlags.BlockaidFotLogging, 'blockaid_fot_logging'],
  [FeatureFlags.Datadog, 'datadog'],
  [FeatureFlags.EmbeddedWallet, 'embedded_wallet'],
  [FeatureFlags.IndicativeSwapQuotes, 'indicative-quotes'],
  [FeatureFlags.InstantTokenBalanceUpdate, 'instant-token-balance-update'],
  [FeatureFlags.MonadTestnet, 'monad_testnet'],
  [FeatureFlags.PortionFields, 'portion-fields'],
  [FeatureFlags.SearchRevamp, 'search_revamp'],
  [FeatureFlags.SharedSwapArbitrumUniswapXExperiment, 'shared_swap_arbitrum_uniswapx_experiment'],
  [FeatureFlags.Soneium, 'soneium'],
  [FeatureFlags.TokenSelectorTrendingTokens, 'token_selector_trending_tokens'],
  [FeatureFlags.TwoSecondSwapQuotePollingInterval, 'two_second_swap_quote_polling_interval'],
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
  [FeatureFlags.GoogleConversionTracking, 'google_conversion_tracking'],
  [FeatureFlags.GqlTokenLists, 'gql_token_lists'],
  [FeatureFlags.L2NFTs, 'l2_nfts'],
  [FeatureFlags.LimitsFees, 'limits_fees'],
  [FeatureFlags.MigrateV3ToV4, 'migrate-v3-to-v4'],
  [FeatureFlags.MonadTestnetDown, 'monad_down'],
  [FeatureFlags.MultipleRoutingOptions, 'multiple_routing_options'],
  [FeatureFlags.NavigationHotkeys, 'navigation_hotkeys'],
  [FeatureFlags.PositionPageV2, 'position_page_v2'],
  [FeatureFlags.PriceRangeInputV2, 'price_range_input_v2'],
  [FeatureFlags.QuickRouteMainnet, 'enable_quick_route_mainnet'],
  [FeatureFlags.TraceJsonRpc, 'traceJsonRpc'],
  [FeatureFlags.TwitterConversionTracking, 'twitter_conversion_tracking'],
  [FeatureFlags.UniswapXSyntheticQuote, 'uniswapx_synthetic_quote'],
  [FeatureFlags.UniswapXv2, 'uniswapx_v2'],
  [FeatureFlags.UniversalSwap, 'universal_swap'],
  [FeatureFlags.V4Data, 'v4_data'],
])

// These names must match the gate name on statsig
export const WALLET_FEATURE_FLAG_NAMES = new Map<FeatureFlags, string>([
  ...SHARED_FEATURE_FLAG_NAMES,
  [FeatureFlags.BlurredLockScreen, 'blurred_lock_screen'],
  [FeatureFlags.DisableFiatOnRampKorea, 'disable-fiat-onramp-korea'],
  [FeatureFlags.ExtensionAutoConnect, 'extension-auto-connect'],
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
