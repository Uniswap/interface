/**
 * Experiment parameter names
 *
 * These must match parameter names on Statsig within an experiment
 */
export enum Experiments {
  ArbitrumXV2OpenOrders = 'arbitrum_uniswapx_openorders_v2',
  OnboardingRedesignHomeScreen = 'onboarding-redesign-home-screen',
  OnboardingRedesignRecoveryBackup = 'onboarding-redesign-recovery-backup',
  AccountCTAs = 'signin_login_connect_ctas',
}

export enum ArbitrumXV2ExperimentGroup {
  Test = 'Test',
  Control = 'Control',
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
  BackupReminderDelaySecs = 'backupReminderDelaySecs',
}

export enum AccountCTAsExperimentGroup {
  Control = 'Control', // Get the app / Connect
  SignInSignUp = 'SignIn-SignUp',
  LogInCreateAccount = 'LogIn-CreateAccount',
}

export type ExperimentProperties = {
  [Experiments.ArbitrumXV2OpenOrders]: ArbitrumXV2OpenOrderProperties
  [Experiments.OnboardingRedesignHomeScreen]: OnboardingRedesignHomeScreenProperties
  [Experiments.OnboardingRedesignRecoveryBackup]: OnboardingRedesignRecoveryBackupProperties
}
