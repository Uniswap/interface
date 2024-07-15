import { DynamicConfigKeys } from 'uniswap/src/features/gating/configs'
import { ExperimentProperties, Experiments } from 'uniswap/src/features/gating/experiments'
import { FeatureFlags, getFeatureFlagName } from 'uniswap/src/features/gating/flags'
import {
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
>(experiment: Exp, param: Param, defaultValue: ValType, customTypeGuard?: (x: unknown) => boolean): ValType {
  const statsigExperiment = useExperiment(experiment).config
  return statsigExperiment.get(param, defaultValue, (value): value is ValType => {
    if (customTypeGuard) {
      return customTypeGuard(value)
    } else {
      return typeof value === typeof defaultValue
    }
  })
}

export function useExperimentValueWithExposureLoggingDisabled<
  Exp extends keyof ExperimentProperties,
  Param extends ExperimentProperties[Exp],
  ValType,
>(experiment: Exp, param: Param, defaultValue: ValType, customTypeGuard?: (x: unknown) => boolean): ValType {
  const statsigExperiment = useExperimentWithExposureLoggingDisabled(experiment).config
  return statsigExperiment.get(param, defaultValue, (value): value is ValType => {
    if (customTypeGuard) {
      return customTypeGuard(value)
    } else {
      return typeof value === typeof defaultValue
    }
  })
}

export function useDynamicConfigValue<
  Conf extends keyof DynamicConfigKeys,
  Key extends DynamicConfigKeys[Conf],
  ValType,
>(config: Conf, key: Key, defaultValue: ValType, customTypeGuard?: (x: unknown) => boolean): ValType {
  const { config: dynamicConfig } = useConfig(config)
  return dynamicConfig.get(key, defaultValue, (value): value is ValType => {
    if (customTypeGuard) {
      return customTypeGuard(value)
    } else {
      return typeof value === typeof defaultValue
    }
  })
}
