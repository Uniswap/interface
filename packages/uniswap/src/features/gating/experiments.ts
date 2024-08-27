/**
 * Experiment parameter names
 *
 * These must match parameter names on Statsig within an experiment
 */
export enum Experiments {
  ArbitrumXV2OpenOrders = 'arbitrum_uniswapx_openorders',
  OnboardingRedesignHomeScreen = 'onboarding-redesign-home-screen',
  OnboardingRedesignRecoveryBackup = 'onboarding-redesign-recovery-backup',
}

export enum ArbitrumXV2OpenOrderProperties {
  PriceImprovementBps = 'priceImprovementBps',
  ForceOpenOrders = 'forceOpenOrders',
  DeadlineBufferSecs = 'deadlineBufferSecs',
  SlippageTolerance = 'slippageTolerance',
}

export enum OnboardingRedesignHomeScreenProperties {
  Enabled = 'enabled',
  ExploreEthChainId = 'exploreEthChainId',
  ExploreTokens = 'exploreTokens',
}

export enum OnboardingRedesignRecoveryBackupProperties {
  Enabled = 'enabled',
}

export type ExperimentProperties = {
  [Experiments.ArbitrumXV2OpenOrders]: ArbitrumXV2OpenOrderProperties
  [Experiments.OnboardingRedesignHomeScreen]: OnboardingRedesignHomeScreenProperties
  [Experiments.OnboardingRedesignRecoveryBackup]: OnboardingRedesignRecoveryBackupProperties
}
