import { DynamicConfigKeys } from 'uniswap/src/features/gating/configs'
import { ExperimentProperties, Experiments } from 'uniswap/src/features/gating/experiments'
import { FeatureFlags, getFeatureFlagName } from 'uniswap/src/features/gating/flags'
import {
  DynamicConfig,
  Statsig,
  useConfig,
  useExperiment,
  useExperimentWithExposureLoggingDisabled,
  useGate,
  useGateWithExposureLoggingDisabled,
} from 'uniswap/src/features/gating/sdk/statsig'
import { logger } from 'utilities/src/logger/logger'

export function useFeatureFlag(flag: FeatureFlags): boolean {
  const name = getFeatureFlagName(flag)
  const { value } = useGate(name)
  return value
}

export function useFeatureFlagWithLoading(flag: FeatureFlags): { value: boolean; isLoading: boolean } {
  const name = getFeatureFlagName(flag)
  const { value, isLoading } = useGate(name)
  return { value, isLoading }
}

export function getFeatureFlag(flag: FeatureFlags): boolean {
  try {
    const name = getFeatureFlagName(flag)
    const result = Statsig.checkGate(name)
    return result
  } catch (e) {
    logger.debug('gating/hooks.ts', 'getFeatureFlag', JSON.stringify({ e }))
    return false
  }
}

export function useFeatureFlagWithExposureLoggingDisabled(flag: FeatureFlags): boolean {
  const name = getFeatureFlagName(flag)
  const { value } = useGateWithExposureLoggingDisabled(name)
  return value
}

export function getFeatureFlagWithExposureLoggingDisabled(flag: FeatureFlags): boolean {
  const name = getFeatureFlagName(flag)
  return Statsig.checkGateWithExposureLoggingDisabled(name)
}

export function useExperimentGroupName(experiment: Experiments): string | null {
  const statsigExperiment = useExperiment(experiment).config
  return statsigExperiment.getGroupName()
}

export function useExperimentGroupNameWithLoading(experiment: Experiments): {
  value: string | null
  isLoading: boolean
} {
  const statsigExperiment = useExperiment(experiment)
  return { value: statsigExperiment.config.getGroupName(), isLoading: statsigExperiment.isLoading }
}

function getValueFromConfig<ValType>(
  config: DynamicConfig,
  param: string,
  defaultValue: ValType,
  customTypeGuard?: (x: unknown) => boolean,
): ValType {
  return config.get(param, defaultValue, (value): value is ValType => {
    if (customTypeGuard) {
      return customTypeGuard(value)
    } else {
      return typeof value === typeof defaultValue
    }
  })
}

export function useExperimentValue<
  Exp extends keyof ExperimentProperties,
  Param extends ExperimentProperties[Exp],
  ValType,
>(experiment: Exp, param: Param, defaultValue: ValType, customTypeGuard?: (x: unknown) => boolean): ValType {
  const statsigExperiment = useExperiment(experiment).config
  return getValueFromConfig(statsigExperiment, param, defaultValue, customTypeGuard)
}

export function getExperimentValue<
  Exp extends keyof ExperimentProperties,
  Param extends ExperimentProperties[Exp],
  ValType,
>(experiment: Exp, param: Param, defaultValue: ValType, customTypeGuard?: (x: unknown) => boolean): ValType {
  const statsigExperiment = Statsig.getExperiment(experiment)
  return getValueFromConfig(statsigExperiment, param, defaultValue, customTypeGuard)
}

export function useExperimentValueWithExposureLoggingDisabled<
  Exp extends keyof ExperimentProperties,
  Param extends ExperimentProperties[Exp],
  ValType,
>(experiment: Exp, param: Param, defaultValue: ValType, customTypeGuard?: (x: unknown) => boolean): ValType {
  const statsigExperiment = useExperimentWithExposureLoggingDisabled(experiment).config
  return getValueFromConfig(statsigExperiment, param, defaultValue, customTypeGuard)
}

export function getExperimentValueWithExposureLoggingDisabled<
  Exp extends keyof ExperimentProperties,
  Param extends ExperimentProperties[Exp],
  ValType,
>(experiment: Exp, param: Param, defaultValue: ValType, customTypeGuard?: (x: unknown) => boolean): ValType {
  const statsigExperiment = Statsig.getExperimentWithExposureLoggingDisabled(experiment)
  return getValueFromConfig(statsigExperiment, param, defaultValue, customTypeGuard)
}

export function useDynamicConfigValue<
  Conf extends keyof DynamicConfigKeys,
  Key extends DynamicConfigKeys[Conf],
  ValType,
>(config: Conf, key: Key, defaultValue: ValType, customTypeGuard?: (x: unknown) => boolean): ValType {
  const { config: dynamicConfig } = useConfig(config)
  return getValueFromConfig(dynamicConfig, key, defaultValue, customTypeGuard)
}

export function getDynamicConfigValue<
  Conf extends keyof DynamicConfigKeys,
  Key extends DynamicConfigKeys[Conf],
  ValType,
>(config: Conf, key: Key, defaultValue: ValType, customTypeGuard?: (x: unknown) => boolean): ValType {
  const dynamicConfig = Statsig.getConfig(config)
  return getValueFromConfig(dynamicConfig, key, defaultValue, customTypeGuard)
}
