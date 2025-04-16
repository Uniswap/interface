import { GasStrategy } from 'uniswap/src/data/tradingApi/types'

/**
 * Dynamic Configs
 * These should match the dynamic config's `Config Name` on Statsig
 */
export enum DynamicConfigs {
  // Shared
  Swap = 'swap_config',
  NetworkRequests = 'network_requests',
  Chains = 'chains',

  // Wallet
  HomeScreenExploreTokens = 'home_screen_explore_tokens',
  ForceUpgrade = 'force_upgrade',
  OnDeviceRecovery = 'on_device_recovery',
  UwuLink = 'uwulink_config',
  GasStrategies = 'gas_strategy',
  MainnetPrivateRpc = 'mainnet_private_rpc',
  DatadogSessionSampleRate = 'datadog_session_sample_rate',
  DatadogIgnoredErrors = 'datadog_ignored_errors',
  EmbeddedWallet = 'embedded_wallet',

  // Web
  QuickRouteChains = 'quick_route_chains',
  AstroChain = 'astro_chain',
  BlockedNftCollections = 'blocked_nft_collections',
  ExternallyConnectableExtension = 'externally_connectable_extension',
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

export enum MainnetPrivateRpcConfigKey {
  UseFlashbots = 'use_flashbots',
  FlashbotsBlockRange = 'flashbots_block_range',
  FlashbotsRefundPercent = 'flashbots_refund_percent',
  SendFlashbotsAuthenticationHeader = 'send_authentication_header',
}

// Web
export enum QuickRouteChainsConfigKey {
  Chains = 'quick_route_chains',
}

export enum AstroChainConfigKey {
  Url = 'url',
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
  [DynamicConfigs.MainnetPrivateRpc]: MainnetPrivateRpcConfigKey
  [DynamicConfigs.DatadogIgnoredErrors]: DatadogIgnoredErrorsConfigKey
  [DynamicConfigs.DatadogSessionSampleRate]: DatadogSessionSampleRateKey
  [DynamicConfigs.EmbeddedWallet]: EmbeddedWalletConfigKey

  // Web
  [DynamicConfigs.QuickRouteChains]: QuickRouteChainsConfigKey
  [DynamicConfigs.AstroChain]: AstroChainConfigKey
  [DynamicConfigs.BlockedNftCollections]: BlockedNftCollectionsConfigKey
  [DynamicConfigs.ExternallyConnectableExtension]: ExternallyConnectableExtensionConfigKey
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
