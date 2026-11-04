import {
  EmbeddedWalletOnboardingProperties,
  Experiments,
  getExperimentValue,
  useExperimentValueWithExposureLoggingDisabled,
} from '@universe/gating'

const EXPERIMENT_CONFIG = {
  experiment: Experiments.EmbeddedWalletOnboarding,
  param: EmbeddedWalletOnboardingProperties.NewFlowEnabled,
  defaultValue: false,
} as const

/**
 * Reads the embedded-wallet onboarding experiment arm WITHOUT logging a Statsig exposure.
 *
 * Use this for render decisions. Exposure is logged separately via
 * {@link logEmbeddedWalletOnboardingExposure} exactly when the user opens the create-wallet modal,
 * so the always-mounted GetTheAppModal does not expose the entire EmbeddedWallet population on
 * every page load. `false` (the default) renders the existing control flow.
 */
export function useIsEmbeddedWalletOnboardingNewFlow(): boolean {
  return useExperimentValueWithExposureLoggingDisabled(EXPERIMENT_CONFIG)
}

/**
 * Logs the Statsig exposure for the embedded-wallet onboarding experiment by reading the arm with
 * exposure logging enabled. Call once when the user enters the flow (modal open) so both arms are
 * counted at the same entry point.
 */
export function logEmbeddedWalletOnboardingExposure(): void {
  getExperimentValue(EXPERIMENT_CONFIG)
}
