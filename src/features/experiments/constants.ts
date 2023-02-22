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
