/**
 * Experiment names
 * These should match the Experiment Key on Amplitude
 */
export enum EXPERIMENTS {
  StickyTabsHeader = 'sticky-tabs-header',
}

export enum FEATURE_FLAGS {
  AccountSwitcherModal = 'account-switcher-modal',
  FiatOnRamp = 'fiat-onramp',
  SwapNativeKeyboard = 'swap-native-keyboard',
  SwapPermit2 = 'swap-permit-2',
}

/**
 * Experiment variants
 * These should match the `Variant Value` on Amplitude
 */
export enum EXP_VARIANTS {
  Control = 'control',
}
