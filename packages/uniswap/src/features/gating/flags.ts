import { logger } from 'utilities/src/logger/logger'
import { isInterface } from 'utilities/src/platform'
/**
 * Feature flag names
 */
export enum FeatureFlags {
  // Shared
  Datadog,
  ForAggregator,
  IndicativeSwapQuotes,
  PortionFields,
  SharedSwapArbitrumUniswapXExperiment,
  TokenProtection,
  UnichainPromo,
  UniswapX,
  UniswapXPriorityOrders,
  V4Swap,
  MonadTestnet,

  // Wallet
  DisableFiatOnRampKorea,
  ExtensionAppRating,
  ExtensionAutoConnect,
  ExtensionClaimUnitag,
  ExtensionPromotionGA,
  FeedTab,
  FiatOffRamp,
  ForMonorepoMigration,
  OnboardingKeyring,
  OpenAIAssistant,
  PrivateRpc,
  Scantastic,
  SelfReportSpamNFTs,
  TransactionDetailsSheet,
  UnitagsDeviceAttestation,
  UwULink,

  // Web
  AATestWeb,
  ConversionTracking,
  Eip6936Enabled,
  GoogleConversionTracking,
  GqlTokenLists,
  L2NFTs,
  LimitsFees,
  LPRedesign,
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

  // TODO(WEB-3625): Remove these once we have a generalized system for outage banners.
  OutageBannerArbitrum,
  OutageBannerOptimism,
  OutageBannerPolygon,
}

// These names must match the gate name on statsig
export const SHARED_FEATURE_FLAG_NAMES = new Map<FeatureFlags, string>([
  [FeatureFlags.Datadog, 'datadog'],
  [FeatureFlags.IndicativeSwapQuotes, 'indicative-quotes'],
  [FeatureFlags.MonadTestnet, 'monad_testnet'],
  [FeatureFlags.PortionFields, 'portion-fields'],
  [FeatureFlags.SharedSwapArbitrumUniswapXExperiment, 'shared_swap_arbitrum_uniswapx_experiment'],
  [FeatureFlags.TokenProtection, 'token_protection'],
  [FeatureFlags.UnichainPromo, 'unichain_promo'],
  [FeatureFlags.UniswapX, 'uniswapx'],
  [FeatureFlags.UniswapXPriorityOrders, 'uniswapx_priority_orders'],
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
  [FeatureFlags.MultipleRoutingOptions, 'multiple_routing_options'],
  [FeatureFlags.NavigationHotkeys, 'navigation_hotkeys'],
  // TODO(WEB-3625): Remove these once we have a generalized system for outage banners.
  [FeatureFlags.OutageBannerArbitrum, 'outage_banner_feb_2024_arbitrum'],
  [FeatureFlags.OutageBannerOptimism, 'outage_banner_feb_2024_optimism'],
  [FeatureFlags.OutageBannerPolygon, 'outage_banner_feb_2024_polygon'],

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
  [FeatureFlags.DisableFiatOnRampKorea, 'disable-fiat-onramp-korea'],
  [FeatureFlags.ExtensionAppRating, 'extension_app_rating'],
  [FeatureFlags.ExtensionAutoConnect, 'extension-auto-connect'],
  [FeatureFlags.ExtensionClaimUnitag, 'extension-claim-unitag'],
  [FeatureFlags.ExtensionPromotionGA, 'extension-promotion-ga'],
  [FeatureFlags.FeedTab, 'feed-tab'],
  [FeatureFlags.FiatOffRamp, 'fiat-offramp'],
  [FeatureFlags.ForAggregator, 'for-aggregator'],
  [FeatureFlags.ForMonorepoMigration, 'for-monorepo-migration'],
  [FeatureFlags.OnboardingKeyring, 'onboarding-keyring'],
  [FeatureFlags.OpenAIAssistant, 'openai-assistant'],
  [FeatureFlags.PrivateRpc, 'mev-blocker'],
  [FeatureFlags.Scantastic, 'scantastic'],
  [FeatureFlags.SelfReportSpamNFTs, 'self-report-spam-nfts'],
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
