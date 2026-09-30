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
  Arc,
  BlockaidFotLogging,
  ChainedActions,
  DisableSwap7702,
  DisableSessionsForPlan,
  EmbeddedWallet,
  EnablePermitMismatchUX,
  ForceDisableWalletGetCapabilities,
  ForcePermitTransactions,
  GasFeeOverrides,
  HashcashSolverEnabled,
  Ink,
  LimitCancelTimeout,
  Linea,
  MegaETH,
  NetworkFilterV2,
  NoUniswapInterfaceFees,
  PermissionedPositions,
  PortfolioPoolsBalances,
  PortionFields,
  RandomizeQuotePolling,
  RequestSwapSteps,
  Robinhood,
  SearchV2UI,
  SmartWallet,
  SmartWalletDisableVideo,
  Tempo,
  TokenCategories,
  TokenSelectorUxRevamp,
  TurnstileSolverEnabled,
  TwoSecondSwapQuotePollingInterval,
  UniquoteEnabled,
  UniRpcEnabled,
  UniswapX,
  UseUniversalRouterVersion211,
  V2EndpointsPortfolio,
  ViemEnabled,
  ViemProviderEnabled,
  XLayer,

  // Wallet
  DisableFiatOnRampKorea,
  Eip5792Methods,
  EnableExportPrivateKeys,
  EnableRestoreSeedPhrase,
  EnableTransactionSpacingForDelegatedAccounts,

  NotificationApiDataSource,
  NotificationOnboardingCard,
  NotificationService,

  Scantastic,
  SelfReportSpamNFTs,
  SmartWalletSettings,
  SmartWalletUpgradeNotice,
  Support7677GasSponsorship,
  UwULink,

  // Web
  AATestWeb,
  AdvancedPoolsFiltering,
  AuctionSearch,
  BatchedSwaps,
  DisableV1EwRotation,
  DummyFlagTest,
  EnablePoolsXyzBanner,
  EnablePoolsXyzTeaser,
  LimitsFees,
  LiquidityBatchedTransactions,
  LpPdpDepthChart,
  Margin,
  PortfolioDefiTab,
  QuickLaunch,
  TokenProvenance,
  ToucanTickDetailsTooltip,
  TraceJsonRpc,
  UnificationCopy,
  UnirouteEnabled,
  UniversalSwap,
}
/* oxlint-enable typescript/prefer-enum-initializers */

// These names must match the gate name on statsig.
// Add in alphabetical order to decrease probability of merge conflicts.
const SHARED_FEATURE_FLAG_NAMES_RECORD = {
  [FeatureFlags.AllowUniswapXOnlyRoutesInSwapSettings]: 'allow_uniswapx_only_routes_in_swap_settings',
  [FeatureFlags.Arc]: 'arc',
  [FeatureFlags.BlockaidFotLogging]: 'blockaid_fot_logging',
  [FeatureFlags.ChainedActions]: 'enable_chained_actions',
  [FeatureFlags.DisableSessionsForPlan]: 'disable_sessions_for_plan',
  [FeatureFlags.DisableSwap7702]: 'disable-swap-7702',
  [FeatureFlags.EmbeddedWallet]: 'embedded_wallet',
  [FeatureFlags.EnablePermitMismatchUX]: 'enable_permit2_mismatch_ux',
  [FeatureFlags.ForceDisableWalletGetCapabilities]: 'force_disable_wallet_get_capabilities',
  [FeatureFlags.ForcePermitTransactions]: 'force_permit_transactions',
  [FeatureFlags.GasFeeOverrides]: 'gas_fee_overrides',
  [FeatureFlags.HashcashSolverEnabled]: 'sessions_hashcash_solver_enabled',
  [FeatureFlags.Ink]: 'ink',
  [FeatureFlags.LimitCancelTimeout]: 'limit_cancel_timeout',
  [FeatureFlags.Linea]: 'linea',
  [FeatureFlags.MegaETH]: 'megaeth',
  [FeatureFlags.NetworkFilterV2]: 'network_filter_v2',
  [FeatureFlags.NoUniswapInterfaceFees]: 'no_uniswap_interface_fees',
  [FeatureFlags.NotificationApiDataSource]: 'notification_api_data_source',
  [FeatureFlags.PermissionedPositions]: 'permissioned_positions',
  [FeatureFlags.PortfolioPoolsBalances]: 'portfolio_pools_balances',
  [FeatureFlags.PortionFields]: 'portion-fields',
  [FeatureFlags.RandomizeQuotePolling]: 'randomize_quote_polling',
  [FeatureFlags.RequestSwapSteps]: 'request_swap_steps',
  [FeatureFlags.Robinhood]: 'robinhood',
  [FeatureFlags.SearchV2UI]: 'search_v2_ui',
  [FeatureFlags.SelfReportSpamNFTs]: 'self-report-spam-nfts',
  [FeatureFlags.SmartWallet]: 'smart-wallet',
  [FeatureFlags.SmartWalletDisableVideo]: 'smart_wallet_disable_video',
  [FeatureFlags.SmartWalletUpgradeNotice]: 'smart_wallet_upgrade_notice',
  [FeatureFlags.Support7677GasSponsorship]: 'support_7677_gas_sponsorship',
  [FeatureFlags.Tempo]: 'tempo',
  [FeatureFlags.TokenCategories]: 'token_categories',
  [FeatureFlags.TokenSelectorUxRevamp]: 'token_selector_ux_revamp',
  [FeatureFlags.TurnstileSolverEnabled]: 'sessions_turnstile_solver_enabled',
  [FeatureFlags.TwoSecondSwapQuotePollingInterval]: 'two_second_swap_quote_polling_interval',
  [FeatureFlags.UniRpcEnabled]: 'unirpc_enabled',
  [FeatureFlags.UniquoteEnabled]: 'uniquote_enabled',
  [FeatureFlags.UnirouteEnabled]: 'uniroute_rollout',
  [FeatureFlags.UniswapX]: 'uniswapx',
  [FeatureFlags.UseUniversalRouterVersion211]: 'use_ur_version_2.1.1',
  [FeatureFlags.V2EndpointsPortfolio]: 'v2_endpoints_portfolio',
  [FeatureFlags.ViemEnabled]: 'viem_enabled',
  [FeatureFlags.ViemProviderEnabled]: 'viem_provider_enabled',
  [FeatureFlags.XLayer]: 'x_layer',
} as const satisfies Partial<Record<FeatureFlags, string>>

// These names must match the gate name on statsig.
// Add in alphabetical order to decrease probability of merge conflicts.
const WEB_ONLY_FEATURE_FLAG_NAMES_RECORD = {
  [FeatureFlags.AATestWeb]: 'aatest_web',
  [FeatureFlags.AdvancedPoolsFiltering]: 'advanced_pools_filtering',
  [FeatureFlags.AuctionSearch]: 'auction_search',
  [FeatureFlags.BatchedSwaps]: 'batched_swaps',
  [FeatureFlags.DisableV1EwRotation]: 'disable_v1_ew_rotation',
  [FeatureFlags.DummyFlagTest]: 'dummy_flag_test',
  [FeatureFlags.EnablePoolsXyzBanner]: 'enable_pools_xyz_banner',
  [FeatureFlags.EnablePoolsXyzTeaser]: 'enable_pools_xyz_teaser',
  [FeatureFlags.LimitsFees]: 'limits_fees',
  [FeatureFlags.LiquidityBatchedTransactions]: 'liquidity_batched_transactions',
  [FeatureFlags.LpPdpDepthChart]: 'lp_pdp_depth_chart',
  [FeatureFlags.Margin]: 'margin',
  [FeatureFlags.PortfolioDefiTab]: 'portfolio_defi_tab',
  [FeatureFlags.QuickLaunch]: 'quick_launch',
  [FeatureFlags.TokenProvenance]: 'token_provenance',
  [FeatureFlags.ToucanTickDetailsTooltip]: 'toucan_tick_details_tooltip',
  [FeatureFlags.TraceJsonRpc]: 'traceJsonRpc',
  [FeatureFlags.UnificationCopy]: 'unification_copy',
  [FeatureFlags.UniversalSwap]: 'universal_swap',
} as const satisfies Partial<Record<FeatureFlags, string>>

// These names must match the gate name on statsig.
// Add in alphabetical order to decrease probability of merge conflicts.
const WALLET_ONLY_FEATURE_FLAG_NAMES_RECORD = {
  [FeatureFlags.DisableFiatOnRampKorea]: 'disable-fiat-onramp-korea',
  [FeatureFlags.Eip5792Methods]: 'eip_5792_methods',
  [FeatureFlags.EnableExportPrivateKeys]: 'enable-export-private-keys',
  [FeatureFlags.EnableRestoreSeedPhrase]: 'enable-restore-seed-phrase',
  [FeatureFlags.EnableTransactionSpacingForDelegatedAccounts]: 'enable_transaction_spacing_for_delegated_accounts',
  [FeatureFlags.NotificationOnboardingCard]: 'notification_onboarding_card',
  [FeatureFlags.NotificationService]: 'notification_system',
  [FeatureFlags.Scantastic]: 'scantastic',
  [FeatureFlags.SmartWalletSettings]: 'smart_wallet_settings',
  [FeatureFlags.UwULink]: 'uwu-link',
} as const satisfies Partial<Record<FeatureFlags, string>>

const WEB_FEATURE_FLAG_NAMES_RECORD = {
  ...SHARED_FEATURE_FLAG_NAMES_RECORD,
  ...WEB_ONLY_FEATURE_FLAG_NAMES_RECORD,
} as const

const WALLET_FEATURE_FLAG_NAMES_RECORD = {
  ...SHARED_FEATURE_FLAG_NAMES_RECORD,
  ...WALLET_ONLY_FEATURE_FLAG_NAMES_RECORD,
} as const

/**
 * Compile-time exhaustiveness check: every `FeatureFlags` member must have a statsig gate
 * name on at least one platform. Adding an enum member without adding its gate name to one
 * of the records above is a typecheck error on this declaration.
 */
export const ALL_FEATURE_FLAG_NAMES_RECORD = {
  ...WALLET_FEATURE_FLAG_NAMES_RECORD,
  ...WEB_FEATURE_FLAG_NAMES_RECORD,
} as const satisfies Record<FeatureFlags, string>

function toFeatureFlagNameMap(record: Readonly<Record<number, string>>): Map<FeatureFlags, string> {
  return new Map(Object.entries(record).map(([flag, name]) => [Number(flag) as FeatureFlags, name]))
}

export const SHARED_FEATURE_FLAG_NAMES = toFeatureFlagNameMap(SHARED_FEATURE_FLAG_NAMES_RECORD)

export const WEB_FEATURE_FLAG_NAMES = toFeatureFlagNameMap(WEB_FEATURE_FLAG_NAMES_RECORD)

export const WALLET_FEATURE_FLAG_NAMES = toFeatureFlagNameMap(WALLET_FEATURE_FLAG_NAMES_RECORD)

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
    // Every flag has a name on at least one platform (enforced at compile time via
    // ALL_FEATURE_FLAG_NAMES_RECORD), but a flag can still be looked up on a platform
    // it is not mapped for (e.g. a wallet-only flag on web).
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
