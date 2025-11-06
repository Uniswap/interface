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
  Swap = 'swap_config',
  NetworkRequests = 'network_requests',
  Chains = 'chains',
  SyncTransactionSubmissionChainIds = 'sync_transaction_submission_chain_ids',
  BlockedAsyncSubmissionChainIds = 'blocked_async_submission_chain_ids',

  // Wallet
  HomeScreenExploreTokens = 'home_screen_explore_tokens',
  ForceUpgrade = 'force_upgrade',
  OnDeviceRecovery = 'on_device_recovery',
  UwuLink = 'uwulink_config',
  GasStrategies = 'gas_strategy',
  DatadogSessionSampleRate = 'datadog_session_sample_rate',
  DatadogIgnoredErrors = 'datadog_ignored_errors',
  EmbeddedWalletConfig = 'embedded_wallet_config',
  ExtensionBiometricUnlock = 'extension_biometric_unlock_config',

  // Web
  AstroChain = 'astro_chain',
  BlockedNftCollections = 'blocked_nft_collections',
  ExternallyConnectableExtension = 'externally_connectable_extension',
  LPConfig = 'lp_config',
  AllowedV4WethHookAddresses = 'allowed_v4_weth_hook_addresses',
  OutageBannerChainId = 'outage_banner_chain_id',
}

// Config values go here for easy access

// Shared
export enum SwapConfigKey {
  AverageL1BlockTimeMs = 'averageL1BlockTimeMs',
  AverageL2BlockTimeMs = 'averageL2BlockTimeMs',
  TradingApiSwapRequestMs = 'tradingApiSwapRequestMs',
  MonadTestnetPollingIntervalMs = 'monadTestnetPollingIntervalMs',

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

  LowBalanceWarningGasPercentage = 'lowBalanceWarningGasPercentage',
}

export enum NetworkRequestsConfigKey {
  BalanceMaxRefetchAttempts = 'balanceMaxRefetchAttempts',
}

export enum ChainsConfigKey {
  OrderedChainIds = 'orderedChainIds',
  NewChainIds = 'newChainIds',
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

export enum BlockedNftCollectionsConfigKey {
  BlocklistedCollections = 'blocklistedCollections',
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

export enum OutageBannerChainIdConfigKey {
  ChainId = 'chainId',
}

export type DynamicConfigKeys = {
  // Shared
  [DynamicConfigs.Swap]: SwapConfigKey
  [DynamicConfigs.NetworkRequests]: NetworkRequestsConfigKey
  [DynamicConfigs.Chains]: ChainsConfigKey

  // Wallet
  [DynamicConfigs.HomeScreenExploreTokens]: HomeScreenExploreTokensConfigKey
  [DynamicConfigs.ForceUpgrade]: ForceUpgradeConfigKey
  [DynamicConfigs.OnDeviceRecovery]: OnDeviceRecoveryConfigKey
  [DynamicConfigs.UwuLink]: UwuLinkConfigKey
  [DynamicConfigs.DatadogIgnoredErrors]: DatadogIgnoredErrorsConfigKey
  [DynamicConfigs.DatadogSessionSampleRate]: DatadogSessionSampleRateKey
  [DynamicConfigs.EmbeddedWalletConfig]: EmbeddedWalletConfigKey
  [DynamicConfigs.ExtensionBiometricUnlock]: ExtensionBiometricUnlockConfigKey
  [DynamicConfigs.SyncTransactionSubmissionChainIds]: SyncTransactionSubmissionChainIdsConfigKey

  // Web
  [DynamicConfigs.AstroChain]: AstroChainConfigKey
  [DynamicConfigs.BlockedNftCollections]: BlockedNftCollectionsConfigKey
  [DynamicConfigs.ExternallyConnectableExtension]: ExternallyConnectableExtensionConfigKey
  [DynamicConfigs.LPConfig]: LPConfigKey
  [DynamicConfigs.AllowedV4WethHookAddresses]: AllowedV4WethHookAddressesConfigKey
  [DynamicConfigs.BlockedAsyncSubmissionChainIds]: BlockedAsyncSubmissionChainIdsConfigKey
  [DynamicConfigs.OutageBannerChainId]: OutageBannerChainIdConfigKey
}

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
