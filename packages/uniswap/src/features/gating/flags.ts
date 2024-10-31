import { logger } from 'utilities/src/logger/logger'
import { isInterface } from 'utilities/src/platform'
/**
 * Feature flag names
 */
export enum FeatureFlags {
  // Shared
  Bridging,
  ForAggregator,
  DisableFiatOnRampKorea,
  IndicativeSwapQuotes,
  TokenProtection,
  SelfReportSpamNFTs,
  UniswapXPriorityOrders,
  SharedSwapArbitrumUniswapXExperiment,
  V4Swap,

  // Wallet
  FlashbotsPrivateRpc,
  PrivateRpc,
  PortionFields,
  TransactionDetailsSheet,
  OpenAIAssistant,
  UnitagsDeviceAttestation,
  UniswapX,
  TestnetMode,

  // Mobile
  Datadog,
  ExtensionPromotionGA,
  FeedTab,
  OnboardingKeyring,
  Scantastic,
  UwULink,
  FiatOffRamp,

  // Extension
  ExtensionAutoConnect,
  ExtensionClaimUnitag,

  // Web
  AATestWeb,
  AstroChainLaunchModal,
  UniversalSwap,
  NavigationHotkeys,
  Eip6936Enabled,
  GqlTokenLists,
  LimitsFees,
  L2NFTs,
  MultichainExplore,
  MultipleRoutingOptions,
  QuickRouteMainnet,
  Realtime,
  RestExplore,
  TraceJsonRpc,
  UniswapXSyntheticQuote,
  UniswapXv2,
  V2Everywhere,
  V4Everywhere,
  Zora,
  WorldChain,
  // TODO(WEB-3625): Remove these once we have a generalized system for outage banners.
  OutageBannerArbitrum,
  OutageBannerOptimism,
  OutageBannerPolygon,
}

// These names must match the gate name on statsig
export const WEB_FEATURE_FLAG_NAMES = new Map<FeatureFlags, string>([
  // Shared
  [FeatureFlags.Bridging, 'bridging'],
  [FeatureFlags.ForAggregator, 'for_aggregator_web'],
  [FeatureFlags.IndicativeSwapQuotes, 'indicative-quotes'],
  [FeatureFlags.TokenProtection, 'token_protection'],
  [FeatureFlags.PortionFields, 'portion-fields'],
  [FeatureFlags.UniswapX, 'uniswapx'],
  [FeatureFlags.Datadog, 'datadog'],
  [FeatureFlags.UniswapXPriorityOrders, 'uniswapx_priority_orders'],
  [FeatureFlags.SharedSwapArbitrumUniswapXExperiment, 'shared_swap_arbitrum_uniswapx_experiment'],
  [FeatureFlags.TestnetMode, 'testnet-mode'],
  [FeatureFlags.V4Swap, 'v4_swap'],
  [FeatureFlags.WorldChain, 'world_chain'],

  // Web Specific
  [FeatureFlags.UniversalSwap, 'universal_swap'],
  [FeatureFlags.NavigationHotkeys, 'navigation_hotkeys'],
  [FeatureFlags.Eip6936Enabled, 'eip6963_enabled'],
  [FeatureFlags.GqlTokenLists, 'gql_token_lists'],
  [FeatureFlags.LimitsFees, 'limits_fees'],
  [FeatureFlags.L2NFTs, 'l2_nfts'],
  [FeatureFlags.MultichainExplore, 'multichain_explore'],
  [FeatureFlags.MultipleRoutingOptions, 'multiple_routing_options'],
  [FeatureFlags.QuickRouteMainnet, 'enable_quick_route_mainnet'],
  [FeatureFlags.Realtime, 'realtime'],
  [FeatureFlags.RestExplore, 'rest_explore'],
  [FeatureFlags.TraceJsonRpc, 'traceJsonRpc'],
  [FeatureFlags.AstroChainLaunchModal, 'astro_chain_launch_modal'],
  [FeatureFlags.UniswapXSyntheticQuote, 'uniswapx_synthetic_quote'],
  [FeatureFlags.UniswapXv2, 'uniswapx_v2'],
  [FeatureFlags.V2Everywhere, 'v2_everywhere'],
  [FeatureFlags.V4Everywhere, 'v4_everywhere'],
  [FeatureFlags.Zora, 'zora'],
  [FeatureFlags.AATestWeb, 'aatest_web'],
  // TODO(WEB-3625): Remove these once we have a generalized system for outage banners.
  [FeatureFlags.OutageBannerArbitrum, 'outage_banner_feb_2024_arbitrum'],
  [FeatureFlags.OutageBannerOptimism, 'outage_banner_feb_2024_optimism'],
  [FeatureFlags.OutageBannerPolygon, 'outage_banner_feb_2024_polygon'],
])

// These names must match the gate name on statsig
export const WALLET_FEATURE_FLAG_NAMES = new Map<FeatureFlags, string>([
  // Shared
  [FeatureFlags.Bridging, 'bridging'],
  [FeatureFlags.ForAggregator, 'for-aggregator'],
  [FeatureFlags.DisableFiatOnRampKorea, 'disable-fiat-onramp-korea'],
  [FeatureFlags.IndicativeSwapQuotes, 'indicative-quotes'],
  [FeatureFlags.TokenProtection, 'token_protection'],
  [FeatureFlags.SelfReportSpamNFTs, 'self-report-spam-nfts'],
  [FeatureFlags.UniswapXPriorityOrders, 'uniswapx_priority_orders'],
  [FeatureFlags.SharedSwapArbitrumUniswapXExperiment, 'shared_swap_arbitrum_uniswapx_experiment'],
  [FeatureFlags.TestnetMode, 'testnet-mode'],
  [FeatureFlags.V4Swap, 'v4_swap'],
  [FeatureFlags.WorldChain, 'world_chain'],

  // Wallet Specific
  [FeatureFlags.Datadog, 'datadog'],
  [FeatureFlags.FeedTab, 'feed-tab'],
  [FeatureFlags.FlashbotsPrivateRpc, 'flashbots-private-rpc'],
  [FeatureFlags.PrivateRpc, 'mev-blocker'],
  [FeatureFlags.OpenAIAssistant, 'openai-assistant'],
  [FeatureFlags.OnboardingKeyring, 'onboarding-keyring'],
  [FeatureFlags.PortionFields, 'portion-fields'],
  [FeatureFlags.Scantastic, 'scantastic'],
  [FeatureFlags.TransactionDetailsSheet, 'transaction-details-sheet'],
  [FeatureFlags.UnitagsDeviceAttestation, 'unitags-device-attestation'],
  [FeatureFlags.UwULink, 'uwu-link'],
  [FeatureFlags.UniswapX, 'uniswapx'],
  [FeatureFlags.FiatOffRamp, 'fiat-offramp'],
  // Extension Specific
  [FeatureFlags.ExtensionAutoConnect, 'extension-auto-connect'],
  [FeatureFlags.ExtensionClaimUnitag, 'extension-claim-unitag'],
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
    client !== undefined ? FEATURE_FLAG_NAMES[client] : isInterface ? WEB_FEATURE_FLAG_NAMES : WALLET_FEATURE_FLAG_NAMES
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
