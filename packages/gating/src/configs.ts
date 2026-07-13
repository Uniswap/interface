import { GasStrategy } from '@universe/api'

// TODO: move to own package
export enum Locale {
  Afrikaans = 'af-ZA',
  ArabicSaudi = 'ar-SA',
  Catalan = 'ca-ES',
  ChineseSimplified = 'zh-Hans',
  ChineseTraditional = 'zh-Hant',
  CzechCzechia = 'cs-CZ',
  DanishDenmark = 'da-DK',
  DutchNetherlands = 'nl-NL',
  EnglishUnitedStates = 'en-US',
  FinnishFinland = 'fi-FI',
  FrenchFrance = 'fr-FR',
  GreekGreece = 'el-GR',
  HebrewIsrael = 'he-IL',
  HindiIndia = 'hi-IN',
  HungarianHungarian = 'hu-HU',
  IndonesianIndonesia = 'id-ID',
  ItalianItaly = 'it-IT',
  JapaneseJapan = 'ja-JP',
  KoreanKorea = 'ko-KR',
  MalayMalaysia = 'ms-MY',
  NorwegianNorway = 'no-NO',
  PolishPoland = 'pl-PL',
  PortugueseBrazil = 'pt-BR',
  PortuguesePortugal = 'pt-PT',
  RomanianRomania = 'ro-RO',
  RussianRussia = 'ru-RU',
  Serbian = 'sr-SP',
  SpanishLatam = 'es-419',
  SpanishBelize = 'es-BZ',
  SpanishCuba = 'es-CU',
  SpanishDominicanRepublic = 'es-DO',
  SpanishGuatemala = 'es-GT',
  SpanishHonduras = 'es-HN',
  SpanishMexico = 'es-MX',
  SpanishNicaragua = 'es-NI',
  SpanishPanama = 'es-PA',
  SpanishPeru = 'es-PE',
  SpanishPuertoRico = 'es-PR',
  SpanishElSalvador = 'es-SV',
  SpanishUnitedStates = 'es-US',
  SpanishArgentina = 'es-AR',
  SpanishBolivia = 'es-BO',
  SpanishChile = 'es-CL',
  SpanishColombia = 'es-CO',
  SpanishCostaRica = 'es-CR',
  SpanishEcuador = 'es-EC',
  SpanishSpain = 'es-ES',
  SpanishParaguay = 'es-PY',
  SpanishUruguay = 'es-UY',
  SpanishVenezuela = 'es-VE',
  SwahiliTanzania = 'sw-TZ',
  SwedishSweden = 'sv-SE',
  TurkishTurkey = 'tr-TR',
  UkrainianUkraine = 'uk-UA',
  UrduPakistan = 'ur-PK',
  VietnameseVietnam = 'vi-VN',
}

/**
 * Dynamic Configs
 * These should match the dynamic config's `Config Name` on Statsig
 */
export enum DynamicConfigs {
  // Shared
  BlockedAsyncSubmissionChainIds = 'blocked_async_submission_chain_ids',
  Chains = 'chains',
  DisableWalletSearchTerms = 'disable_wallet_search_terms',
  NetworkRequests = 'network_requests',
  Swap = 'swap_config',
  SyncTransactionSubmissionChainIds = 'sync_transaction_submission_chain_ids',

  // Wallet
  DatadogIgnoredErrors = 'datadog_ignored_errors',
  DatadogSessionSampleRate = 'datadog_session_sample_rate',
  EmbeddedWalletConfig = 'embedded_wallet_config',
  ExtensionBiometricUnlock = 'extension_biometric_unlock_config',
  ForceUpgrade = 'force_upgrade',
  GasStrategies = 'gas_strategy',
  HomeScreenExploreTokens = 'home_screen_explore_tokens',
  OnDeviceRecovery = 'on_device_recovery',
  UwuLink = 'uwulink_config',

  // Web
  AllowedV4WethHookAddresses = 'allowed_v4_weth_hook_addresses',
  AstroChain = 'astro_chain',
  EmbeddedWalletBetaPassphrases = 'embedded_wallet_beta_passphrases',
  ExternallyConnectableExtension = 'externally_connectable_extension',
  LiquidityApprovalSimulation = 'liquidity_approval_simulation',
  LiquidityGasPreEstimation = 'liquidity_gas_pre_estimation',
  LPConfig = 'lp_config',
  OutageBannerChainId = 'outage_banner_chain_id',
  RWAIssuerLogos = 'rwa_issuer_logos',
  VerifiedAuctions = 'verified_auctions',
  AuctionFdvWarning = 'auction_fdv_warning',
}

// Config values go here for easy access

// Shared
export enum SwapConfigKey {
  AverageL1BlockTimeMs = 'averageL1BlockTimeMs',
  AverageL2BlockTimeMs = 'averageL2BlockTimeMs',
  TradingApiSwapRequestMs = 'tradingApiSwapRequestMs',

  MinAutoSlippageToleranceL2 = 'minAutoSlippageToleranceL2',

  EthSwapMinGasAmount = 'ethSwapMinGasAmount',
  EthSendMinGasAmount = 'ethSendMinGasAmount',
  PolygonSwapMinGasAmount = 'polygonSwapMinGasAmount',
  PolygonSendMinGasAmount = 'polygonSendMinGasAmount',
  AvalancheSwapMinGasAmount = 'avalancheSwapMinGasAmount',
  AvalancheSendMinGasAmount = 'avalancheSendMinGasAmount',
  CeloSwapMinGasAmount = 'celoSwapMinGasAmount',
  CeloSendMinGasAmount = 'celoSendMinGasAmount',
  MonSwapMinGasAmount = 'monSwapMinGasAmount',
  MonSendMinGasAmount = 'monSendMinGasAmount',
  SolanaSwapMinGasAmount = 'solanaSwapMinGasAmount',
  SolanaSendMinGasAmount = 'solanaSendMinGasAmount',
  GenericL2SwapMinGasAmount = 'genericL2SwapMinGasAmount',
  GenericL2SendMinGasAmount = 'genericL2SendMinGasAmount',
  TempoSwapMinGasAmount = 'tempoSwapMinGasAmount',
  TempoSendMinGasAmount = 'tempoSendMinGasAmount',
  ArcSwapMinGasAmount = 'arcSwapMinGasAmount',
  ArcSendMinGasAmount = 'arcSendMinGasAmount',

  LowBalanceWarningGasPercentage = 'lowBalanceWarningGasPercentage',

  ChainedActionsUnsupportedChainIds = 'chainedActionsUnsupportedChainIds',
}

export enum NetworkRequestsConfigKey {
  BalanceMaxRefetchAttempts = 'balanceMaxRefetchAttempts',
}

export enum ChainsConfigKey {
  OrderedChainIds = 'orderedChainIds',
  NewChainIds = 'newChainIds',
}

export enum DisableWalletSearchTermsConfigKey {
  Terms = 'terms',
}

// Wallet
export enum ForceUpgradeConfigKey {
  Status = 'status',
  Translations = 'translations',
}

export type ForceUpgradeStatus = 'recommended' | 'required' | 'not-required'

type SupportedLocale = `${Extract<Locale[keyof Locale], string>}`

type ContentMessage = {
  title: string
  description: string
}

export type ForceUpgradeTranslations = Record<SupportedLocale, ContentMessage>

export enum EmbeddedWalletConfigKey {
  BaseUrl = 'baseUrl',
}

export enum ExtensionBiometricUnlockConfigKey {
  EnableOnboardingEnrollment = 'enableOnboardingEnrollment',
  EnableSettingsEnrollment = 'enableSettingsEnrollment',
  EnableUnlocking = 'enableUnlocking',
}

export enum SyncTransactionSubmissionChainIdsConfigKey {
  ChainIds = 'chainIds',
}

export enum BlockedAsyncSubmissionChainIdsConfigKey {
  ChainIds = 'chainIds',
}

export enum HomeScreenExploreTokensConfigKey {
  EthChainId = 'ethChainId',
  Tokens = 'tokens',
}

export enum OnDeviceRecoveryConfigKey {
  AppLoadingTimeoutMs = 'appLoadingTimeoutMs',
  MaxMnemonicsToLoad = 'maxMnemonicsToLoad',
}

export enum UwuLinkConfigKey {
  Allowlist = 'allowlist',
}

export enum DatadogIgnoredErrorsConfigKey {
  Errors = 'errors',
}

export enum DatadogSessionSampleRateKey {
  Rate = 'rate',
}

export enum ExternallyConnectableExtensionConfigKey {
  ExtensionId = 'extensionId',
}

export type DatadogIgnoredErrorsValType = Array<{ messageContains: string; sampleRate: number }>

export type DatadogSessionSampleRateValType = number

export type GasStrategyType = 'general' | 'swap'

export type GasStrategyConditions = {
  name: string
  chainId: number
  types: GasStrategyType
  isActive: boolean
}

export type GasStrategyWithConditions = {
  strategy: GasStrategy
  conditions: GasStrategyConditions
}

export type GasStrategies = {
  strategies: GasStrategyWithConditions[]
}

// Web
export enum QuickRouteChainsConfigKey {
  Chains = 'quick_route_chains',
}

export enum AstroChainConfigKey {
  Url = 'url',
}

export enum LPConfigKey {
  DefaultSlippage = 'defaultSlippage',
  V4SlippageOverride = 'v4SlippageOverride',
}

export enum AllowedV4WethHookAddressesConfigKey {
  HookAddresses = 'hookAddresses',
}

export enum VerifiedAuctionsConfigKey {
  VerifiedAuctionIds = 'verifiedAuctionIds',
}

export enum AuctionFdvWarningConfigKey {
  CommittedVolumeUsdThreshold = 'committedVolumeUsdThreshold',
  BidCountThreshold = 'bidCountThreshold',
  FdvUsdThreshold = 'fdvUsdThreshold',
}

export enum OutageBannerChainIdConfigKey {
  ChainId = 'chainId',
}

export enum LiquidityGasPreEstimationConfigKey {
  EnabledChainIds = 'enabledChainIds',
}

export enum LiquidityApprovalSimulationConfigKey {
  EnabledChainIds = 'enabledChainIds',
}

export enum EmbeddedWalletBetaPassphrasesKey {
  Passphrases = 'passphrases',
}

export enum RWAIssuerLogosConfigKey {
  Logos = 'logos',
}

export type DynamicConfigKeys = {
  // Shared
  [DynamicConfigs.BlockedAsyncSubmissionChainIds]: BlockedAsyncSubmissionChainIdsConfigKey
  [DynamicConfigs.Chains]: ChainsConfigKey
  [DynamicConfigs.DisableWalletSearchTerms]: DisableWalletSearchTermsConfigKey
  [DynamicConfigs.NetworkRequests]: NetworkRequestsConfigKey
  [DynamicConfigs.Swap]: SwapConfigKey
  [DynamicConfigs.SyncTransactionSubmissionChainIds]: SyncTransactionSubmissionChainIdsConfigKey

  // Wallet
  [DynamicConfigs.DatadogIgnoredErrors]: DatadogIgnoredErrorsConfigKey
  [DynamicConfigs.DatadogSessionSampleRate]: DatadogSessionSampleRateKey
  [DynamicConfigs.EmbeddedWalletConfig]: EmbeddedWalletConfigKey
  [DynamicConfigs.ExtensionBiometricUnlock]: ExtensionBiometricUnlockConfigKey
  [DynamicConfigs.ForceUpgrade]: ForceUpgradeConfigKey
  [DynamicConfigs.HomeScreenExploreTokens]: HomeScreenExploreTokensConfigKey
  [DynamicConfigs.OnDeviceRecovery]: OnDeviceRecoveryConfigKey
  [DynamicConfigs.UwuLink]: UwuLinkConfigKey

  // Web
  [DynamicConfigs.AllowedV4WethHookAddresses]: AllowedV4WethHookAddressesConfigKey
  [DynamicConfigs.AuctionFdvWarning]: AuctionFdvWarningConfigKey
  [DynamicConfigs.AstroChain]: AstroChainConfigKey
  [DynamicConfigs.EmbeddedWalletBetaPassphrases]: EmbeddedWalletBetaPassphrasesKey
  [DynamicConfigs.ExternallyConnectableExtension]: ExternallyConnectableExtensionConfigKey
  [DynamicConfigs.LiquidityApprovalSimulation]: LiquidityApprovalSimulationConfigKey
  [DynamicConfigs.LiquidityGasPreEstimation]: LiquidityGasPreEstimationConfigKey
  [DynamicConfigs.LPConfig]: LPConfigKey
  [DynamicConfigs.OutageBannerChainId]: OutageBannerChainIdConfigKey
  [DynamicConfigs.RWAIssuerLogos]: RWAIssuerLogosConfigKey
  [DynamicConfigs.VerifiedAuctions]: VerifiedAuctionsConfigKey
}

// This type must match the format in the statsig dynamic config for rwa_issuer_logos.
// Per-issuer light/dark URLs because remote SVGs can't be recolored by theme.
export type RWAIssuerLogo = {
  light?: string
  dark?: string
}

export type RWAIssuerLogosMap = Record<string, RWAIssuerLogo>

// This type must match the format in statsig dynamic config for uwulink
// https://console.statsig.com/5HjUux4OvSGzgqWIfKFt8i/dynamic_configs/uwulink_config
export type UwULinkAllowlistItem = {
  chainId: number
  address: string
  name: string
  logo?: {
    dark?: string
    light?: string
  }
}

export type UwULinkAllowlist = {
  contracts: UwULinkAllowlistItem[]
  tokenRecipients: UwULinkAllowlistItem[]
}
