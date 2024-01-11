import {
  useExperiment,
  useExperimentWithExposureLoggingDisabled,
  useGate,
  useGateWithExposureLoggingDisabled,
} from 'statsig-react-native'
import { EXPERIMENT_NAMES, EXPERIMENT_PARAMS, FEATURE_FLAGS } from './constants'

export function useFeatureFlag(flagName: FEATURE_FLAGS): boolean {
  const { value } = useGate(flagName)
  return value
}

export function useFeatureFlagWithExposureLoggingDisabled(flagName: FEATURE_FLAGS): boolean {
  const { value } = useGateWithExposureLoggingDisabled(flagName)
  return value
}

export function useExperimentEnabled(experimentName: EXPERIMENT_NAMES): boolean {
  return useExperiment(experimentName).config.getValue(EXPERIMENT_PARAMS.Enabled) as boolean
}

export function useExperimentEnabledWithExposureLoggingDisabled(
  experimentName: EXPERIMENT_NAMES
): boolean {
  return useExperimentWithExposureLoggingDisabled(experimentName).config.getValue(
    EXPERIMENT_PARAMS.Enabled
  ) as boolean
}

// these should match the paramerter options in the experiment settings
export enum SwapRewriteVariant {
  Disabled = 'disabled',
  RewriteStandard = 'rewrite-standard',
  RewriteNoGas = 'rewrite-no-gas',
}

const SWAP_VARIANT_TYPE_PARAMETER_NAME = 'swap-variant-type'

export function useSwapRewriteVariant(): SwapRewriteVariant {
  const variant = useExperiment(EXPERIMENT_NAMES.SwapRewriteVariants).config.get(
    SWAP_VARIANT_TYPE_PARAMETER_NAME, // this should match the paramater name in the experiment settings,
    SwapRewriteVariant.Disabled
  )

  if (
    variant &&
    typeof variant === 'string' &&
    Object.values(SwapRewriteVariant).includes(variant)
  ) {
    return variant as SwapRewriteVariant
  }

  // default case, should never occur
  return SwapRewriteVariant.Disabled
}

export function useSwapRewriteEnabled(): boolean {
  return useSwapRewriteVariant() !== SwapRewriteVariant.Disabled
}
