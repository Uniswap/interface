/**
 * Feature flag names
 * These should match the Gate Key on Statsig
 */
export enum FEATURE_FLAGS {
  FiatOnRamp = 'fiat-onramp',
  SwapPermit2 = 'swap-permit-2',
  WalletConnectV2 = 'wc-v2',
}

/**
 * Dynamic Configs
 * These should match the dynamic config's `Config Name` on Statsig
 * https://console.statsig.com/5M2TFMQiHkbY9RML95FAEa/dynamic_configs
 */
export enum DYNAMIC_CONFIGS {
  ForceUpgrade = 'force_upgrade',
}
