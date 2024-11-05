import { GasStrategy } from 'uniswap/src/data/tradingApi/types'

/**
 * Dynamic Configs
 * These should match the dynamic config's `Config Name` on Statsig
 */
export enum DynamicConfigs {
  // Wallet
  MobileForceUpgrade = 'force_upgrade',
  OnDeviceRecovery = 'on_device_recovery',
  UwuLink = 'uwulink_config',
  Swap = 'swap_config',
  GasStrategies = 'gas_strategy',

  // Web
  QuickRouteChains = 'quick_route_chains',
  AstroChain = 'astro_chain',
}

// Config values go here for easy access

// Wallet
export enum ForceUpgradeConfigKey {
  Status = 'status',
}

export enum OnDeviceRecoveryConfigKey {
  AppLoadingTimeoutMs = 'appLoadingTimeoutMs',
  MaxMnemonicsToLoad = 'maxMnemonicsToLoad',
}

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
  GenericL2SwapMinGasAmount = 'genericL2SwapMinGasAmount',
  GenericL2SendMinGasAmount = 'genericL2SendMinGasAmount',
}

export enum UwuLinkConfigKey {
  Allowlist = 'allowlist',
}

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

export type DynamicConfigKeys = {
  // Shared
  [DynamicConfigs.Swap]: SwapConfigKey

  // Wallet
  [DynamicConfigs.MobileForceUpgrade]: ForceUpgradeConfigKey
  [DynamicConfigs.OnDeviceRecovery]: OnDeviceRecoveryConfigKey
  [DynamicConfigs.UwuLink]: UwuLinkConfigKey

  // Web
  [DynamicConfigs.QuickRouteChains]: QuickRouteChainsConfigKey
  [DynamicConfigs.AstroChain]: AstroChainConfigKey
}
