import { DynamicConfigs, getConfigName } from 'uniswap/src/features/experiments/configs'
import { FeatureFlags, getFeatureFlagName } from 'uniswap/src/features/experiments/flags'
import {
  DynamicConfig,
  useConfig,
  useExperiment,
  useExperimentWithExposureLoggingDisabled,
  useGate,
  useGateWithExposureLoggingDisabled,
} from 'uniswap/src/features/experiments/statsig/statsig'
import { ExperimentParamsWallet, ExperimentsWallet } from './constants'

export function useFeatureFlag(flag: FeatureFlags): boolean {
  const name = getFeatureFlagName(flag)
  const { value } = useGate(name)
  return value
}

export function useFeatureFlagWithExposureLoggingDisabled(flag: FeatureFlags): boolean {
  const name = getFeatureFlagName(flag)
  const { value } = useGateWithExposureLoggingDisabled(name)
  return value
}

export function useExperimentEnabled(experimentName: ExperimentsWallet): boolean {
  return useExperiment(experimentName).config.getValue(ExperimentParamsWallet.Enabled) as boolean
}

export function useExperimentEnabledWithExposureLoggingDisabled(
  experimentName: ExperimentsWallet
): boolean {
  return useExperimentWithExposureLoggingDisabled(experimentName).config.getValue(
    ExperimentParamsWallet.Enabled
  ) as boolean
}

export function useDynamicConfig(config: DynamicConfigs): DynamicConfig {
  const name = getConfigName(config)
  const { config: dynamicConfig } = useConfig(name)
  return dynamicConfig
}
