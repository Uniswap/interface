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

  // Web
  QuickRouteChains = 'quick_route_chains',
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
}

export enum UwuLinkConfigKey {
  Allowlist = 'allowlist',
}

// Web
export enum QuickRouteChainsConfigKey {
  Chains = 'quick_route_chains',
}

export type DynamicConfigKeys = {
  // Wallet
  [DynamicConfigs.MobileForceUpgrade]: ForceUpgradeConfigKey
  [DynamicConfigs.OnDeviceRecovery]: OnDeviceRecoveryConfigKey
  [DynamicConfigs.UwuLink]: UwuLinkConfigKey
  [DynamicConfigs.Swap]: SwapConfigKey

  // Web
  [DynamicConfigs.QuickRouteChains]: QuickRouteChainsConfigKey
}
