/**
 * Experiment names
 * These should match the Experiment Key on Statsig
 */
export enum EXPERIMENTS {
  StickyTabsHeader = 'sticky-tabs-header',
}

/**
 * Feature flag names
 * These should match the Gate Key on Statsig
 */
export enum FEATURE_FLAGS {
  FiatOnRamp = 'fiat-onramp',
  SwapNativeKeyboard = 'swap-native-keyboard',
  SwapPermit2 = 'swap-permit-2',
}

/**
 * Experiment variants
 * These should match the `Variant Value` on Statsig
 */
export enum EXP_VARIANTS {
  Control = 'control',
}

/**
 * Dynamic Configs
 * These should match the dynamic config's `Config Name` on Statsig
 * https://console.statsig.com/5M2TFMQiHkbY9RML95FAEa/dynamic_configs
 */
export enum DYNAMIC_CONFIGS {
  ForceUpgrade = 'force_upgrade',
}
