import { NotImplementedError } from 'utilities/src/errors'
import { EXPERIMENT_NAMES, FEATURE_FLAGS } from './constants'

export function useFeatureFlag(_flagName: FEATURE_FLAGS): boolean {
  throw new NotImplementedError('See `.native.ts` and `.web.ts` files.')
}

export function useFeatureFlagWithExposureLoggingDisabled(_flagName: FEATURE_FLAGS): boolean {
  throw new NotImplementedError('See `.native.ts` and `.web.ts` files.')
}

export function useExperimentEnabled(_experimentName: EXPERIMENT_NAMES): boolean {
  throw new NotImplementedError('See `.native.ts` and `.web.ts` files.')
}

export function useExperimentEnabledWithExposureLoggingDisabled(
  _experimentName: EXPERIMENT_NAMES
): boolean {
  throw new NotImplementedError('See `.native.ts` and `.web.ts` files.')
}
