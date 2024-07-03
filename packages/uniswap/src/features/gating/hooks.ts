import { DynamicConfigs, getConfigName } from 'uniswap/src/features/gating/configs'
import { ExperimentProperties, Experiments } from 'uniswap/src/features/gating/experiments'
import { FeatureFlags, getFeatureFlagName } from 'uniswap/src/features/gating/flags'
import {
  DynamicConfig,
  useConfig,
  useExperiment,
  useExperimentWithExposureLoggingDisabled,
  useGate,
  useGateWithExposureLoggingDisabled,
} from 'uniswap/src/features/gating/sdk/statsig'

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

export function useExperimentGroupName(experiment: Experiments): string | null {
  const statsigExperiment = useExperiment(experiment).config
  return statsigExperiment.getGroupName()
}

export function useExperimentValue<
  Exp extends keyof ExperimentProperties,
  Param extends ExperimentProperties[Exp],
  ValType,
>(experiment: Exp, param: Param, defaultValue: ValType): ValType {
  const statsigExperiment = useExperiment(experiment).config
  return statsigExperiment.get(param, defaultValue, (value): value is ValType => {
    return typeof value === typeof defaultValue
  })
}

export function useExperimentValueWithExposureLoggingDisabled<
  Exp extends keyof ExperimentProperties,
  Param extends ExperimentProperties[Exp],
  ValType,
>(experiment: Exp, param: Param, defaultValue: ValType): ValType {
  const statsigExperiment = useExperimentWithExposureLoggingDisabled(experiment).config
  return statsigExperiment.get(param, defaultValue, (value): value is ValType => {
    return typeof value === typeof defaultValue
  })
}

export function useDynamicConfig(config: DynamicConfigs): DynamicConfig {
  const name = getConfigName(config)
  const { config: dynamicConfig } = useConfig(name)
  return dynamicConfig
}
