/**
 * Experiment names
 * These should match Experiment Name on Statsig
 */
export enum ExperimentsWallet {
  OnboardingNewCreateImportFlow = 'onboarding-ab-1',
}

/**
 * Experiment parameter names
 *
 * These should match parameter names on Statsig within an experiment
 */
export enum ExperimentParamsWallet {
  Enabled = 'enabled',
}

// Add experiment values here as needed.
export const EXPERIMENT_VALUES_BY_EXPERIMENT: Record<
  string,
  Record<string, Record<string, string>>
> = {}

// Dummy key since we use the reverse proxy will handle the real key
export const DUMMY_STATSIG_SDK_KEY = 'client-000000000000000000000000000000000000000000'
