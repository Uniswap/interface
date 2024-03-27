import { isInterface } from 'uniswap/src/utils/platform'
import { logger } from 'utilities/src/logger/logger'
/**
 * Feature flag names
 * These must match the Gate Key on Statsig
 */
export enum FeatureFlags {
  // Shared
  CurrencyConversion,
  UniconsV2,
  Unitags,

  // Wallet
  FeedTab,
  ForAggregator,
  GatewayDNSUpdateMobile,
  LanguageSelection,
  MevBlocker,
  PortionFields,
  RestoreWallet,
  Scantastic,
  SeedPhraseRefactorNative,
  SendRewrite,
  TradingApi,
  UnitagsDeviceAttestation,
  UwULink,

  // Web
  Eip6936Enabled,
  ExitAnimation,
  FallbackProvider,
  GqlTokenLists,
  LimitsEnabled,
  LimitsFees,
  MultichainUX,
  QuickRouteMainnet,
  Realtime,
  SendEnabled,
  TraceJsonRpc,
  UniswapXSyntheticQuote,
  V2Everywhere,
  // TODO(WEB-3625): Remove these once we have a generalized system for outage banners.
  OutageBannerArbitrum,
  OutageBannerOptimism,
  OutageBannerPolygon,
}

export const WEB_FEATURE_FLAG_NAMES = new Map<FeatureFlags, string>([
  // Shared
  [FeatureFlags.CurrencyConversion, 'currency_conversion'],
  [FeatureFlags.UniconsV2, 'unicon_V2'],
  // Web Specific
  [FeatureFlags.Eip6936Enabled, 'eip6963_enabled'],
  [FeatureFlags.ExitAnimation, 'exit_animation'],
  [FeatureFlags.FallbackProvider, 'fallback_provider'],
  [FeatureFlags.GqlTokenLists, 'gql_token_lists'],
  [FeatureFlags.LimitsEnabled, 'limits_enabled'],
  [FeatureFlags.LimitsFees, 'limits_fees'],
  [FeatureFlags.MultichainUX, 'multichain_ux'],
  [FeatureFlags.QuickRouteMainnet, 'enable_quick_route_mainnet'],
  [FeatureFlags.Realtime, 'realtime'],
  [FeatureFlags.SendEnabled, 'swap_send'],
  [FeatureFlags.TraceJsonRpc, 'traceJsonRpc'],
  [FeatureFlags.UniswapXSyntheticQuote, 'uniswapx_synthetic_quote'],
  [FeatureFlags.V2Everywhere, 'v2_everywhere'],
  // TODO(WEB-3625): Remove these once we have a generalized system for outage banners.
  [FeatureFlags.OutageBannerArbitrum, 'outage_banner_feb_2024_arbitrum'],
  [FeatureFlags.OutageBannerOptimism, 'outage_banner_feb_2024_optimism'],
  [FeatureFlags.OutageBannerPolygon, 'outage_banner_feb_2024_polygon'],
])

export const WALLET_FEATURE_FLAG_NAMES = new Map<FeatureFlags, string>([
  // Shared
  [FeatureFlags.CurrencyConversion, 'currency_conversion'],
  [FeatureFlags.UniconsV2, 'unicons-v2'],
  [FeatureFlags.Unitags, 'unitags'],
  // Wallet Specific
  [FeatureFlags.FeedTab, 'feed-tab'],
  [FeatureFlags.ForAggregator, 'for-aggregator'],
  [FeatureFlags.GatewayDNSUpdateMobile, 'cloudflare-gateway'],
  [FeatureFlags.LanguageSelection, 'language-selection'],
  [FeatureFlags.MevBlocker, 'mev-blocker'],
  [FeatureFlags.PortionFields, 'portion-fields'],
  [FeatureFlags.RestoreWallet, 'restore-wallet'],
  [FeatureFlags.Scantastic, 'scantastic'],
  [FeatureFlags.SeedPhraseRefactorNative, 'refactor-seed-phrase-native'],
  [FeatureFlags.SendRewrite, 'send-rewrite'],
  [FeatureFlags.TradingApi, 'trading-api'],
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
      ? WEB_FEATURE_FLAG_NAMES
      : WALLET_FEATURE_FLAG_NAMES
  const name = names.get(flag)
  if (!name) {
    const err = new Error(
      `Feature ${FeatureFlags[flag]} does not have a name mapped for this application`
    )

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
