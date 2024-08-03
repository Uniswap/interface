/**
 * Dynamic Configs
 * These should match the dynamic config's `Config Name` on Statsig
 */
export enum DynamicConfigs {
  // Wallet
  MobileForceUpgrade = 'force_upgrade',
  OnDeviceRecovery = 'on_device_recovery',
  PollingIntervals = 'polling_intervals',
  Slippage = 'slippage_configs',
  UwuLink = 'uwulink_config',

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

export enum PollingIntervalsConfigKey {
  AverageL1BlockTimeMs = 'averageL1BlockTimeMs',
  AverageL2BlockTimeMs = 'averageL2BlockTimeMs',
  TradingApiSwapRequestMs = 'tradingApiSwapRequestMs',
}

export enum SlippageConfigKey {
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
  [DynamicConfigs.PollingIntervals]: PollingIntervalsConfigKey
  [DynamicConfigs.Slippage]: SlippageConfigKey
  [DynamicConfigs.UwuLink]: UwuLinkConfigKey

  // Web
  [DynamicConfigs.QuickRouteChains]: QuickRouteChainsConfigKey
}
