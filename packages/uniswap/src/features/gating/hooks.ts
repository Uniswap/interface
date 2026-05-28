import { StatsigClientEventCallback, StatsigLoadingStatus } from '@statsig/client-core'
import { useEffect, useMemo, useState } from 'react'
import { DynamicConfigKeys } from 'uniswap/src/features/gating/configs'
import { ExperimentProperties, Experiments } from 'uniswap/src/features/gating/experiments'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { isFeatureFlagForceDisabled } from 'uniswap/src/features/gating/overrides'
import {
  TypedReturn,
  getStatsigClient,
  useDynamicConfig,
  useExperiment,
  // useGateValue,
  useLayer,
  useStatsigClient,
} from 'uniswap/src/features/gating/sdk/statsig'
import { isInterface } from 'utilities/src/platform'
// import { logger } from 'utilities/src/logger/logger'

export function useFeatureFlag(flag: FeatureFlags): boolean {
  // const name = getFeatureFlagName(flag)
  // let value = useGateValue(name)

  // Check if flag is force-disabled via environment configuration
  if (isFeatureFlagForceDisabled(flag)) {
    return false
  }

  // Default to true when statsig is not configured
  return true
}

export function useFeatureFlagWithLoading(flag: FeatureFlags): { value: boolean; isLoading: boolean } {
  // const { isStatsigLoading } = useStatsigClientStatus()
  // const name = getFeatureFlagName(flag)
  // const { value } = useFeatureGate(name)

  // Check if flag is force-disabled via environment configuration
  if (isFeatureFlagForceDisabled(flag)) {
    return { value: false, isLoading: false }
  } else {
    return { value: true, isLoading: false }
  }

  // return { value, isLoading: isStatsigLoading }
}

export function getFeatureFlag(flag: FeatureFlags): boolean {
  // try {
  //   // Check if flag is force-disabled via environment configuration
  //   if (isFeatureFlagForceDisabled(flag)) {
  //     return false
  //   }

  //   const name = getFeatureFlagName(flag)
  //   return getStatsigClient().checkGate(name)
  // } catch (e) {
  //   logger.debug('gating/hooks.ts', 'getFeatureFlag', JSON.stringify({ e }))
  //   return false
  // }

  // Check if flag is force-disabled via environment configuration
  if (isFeatureFlagForceDisabled(flag)) {
    return false
  }

  // Default to true when statsig is not configured
  return true
}

export function useFeatureFlagWithExposureLoggingDisabled(flag: FeatureFlags): boolean {
  // const name = getFeatureFlagName(flag)
  // const value = useGateValue(name, { disableExposureLog: true })

  // Check if flag is force-disabled via environment configuration
  if (isFeatureFlagForceDisabled(flag)) {
    return false
  }

  // Default to true when statsig is not configured
  return true

  // return value
}

export function getFeatureFlagWithExposureLoggingDisabled(flag: FeatureFlags): boolean {
  // Check if flag is force-disabled via environment configuration
  if (isFeatureFlagForceDisabled(flag)) {
    return false
  }

  // const name = getFeatureFlagName(flag)
  // return getStatsigClient().checkGate(name, { disableExposureLog: true })

  // Default to true when statsig is not configured
  return true
}

export function useExperimentGroupNameWithLoading(experiment: Experiments): {
  value: string | null
  isLoading: boolean
} {
  const { isStatsigLoading } = useStatsigClientStatus()
  const statsigExperiment = useExperiment(experiment)
  return { value: statsigExperiment.groupName, isLoading: isStatsigLoading }
}

export function useExperimentGroupName(experiment: Experiments): string | null {
  const { groupName } = useExperiment(experiment)
  return groupName ?? null
}

export function useExperimentValue<
  Exp extends keyof ExperimentProperties,
  Param extends ExperimentProperties[Exp],
  ValType,
>(experiment: Exp, param: Param, defaultValue: ValType, customTypeGuard?: (x: unknown) => x is ValType): ValType {
  const statsigExperiment = useExperiment(experiment)
  const value = statsigExperiment.get(param, defaultValue)
  return checkTypeGuard(value as unknown as TypedReturn<ValType>, defaultValue, customTypeGuard)
}

export function getExperimentValue<
  Exp extends keyof ExperimentProperties,
  Param extends ExperimentProperties[Exp],
  ValType,
>(experiment: Exp, param: Param, defaultValue: ValType, customTypeGuard?: (x: unknown) => x is ValType): ValType {
  const statsigExperiment = getStatsigClient().getExperiment(experiment)
  const value = statsigExperiment.get(param, defaultValue)
  return checkTypeGuard(value, defaultValue, customTypeGuard)
}

export function useExperimentValueWithExposureLoggingDisabled<
  Exp extends keyof ExperimentProperties,
  Param extends ExperimentProperties[Exp],
  ValType,
>(experiment: Exp, param: Param, defaultValue: ValType, customTypeGuard?: (x: unknown) => x is ValType): ValType {
  const statsigExperiment = useExperiment(experiment, { disableExposureLog: true })
  const value = statsigExperiment.get(param, defaultValue)
  return checkTypeGuard(value as unknown as TypedReturn<ValType>, defaultValue, customTypeGuard)
}

export function useDynamicConfigValue<
  Conf extends keyof DynamicConfigKeys,
  Key extends DynamicConfigKeys[Conf],
  ValType,
>(config: Conf, key: Key, defaultValue: ValType, customTypeGuard?: (x: unknown) => x is ValType): ValType {
  const dynamicConfig = useDynamicConfig(config)
  const value = dynamicConfig.get(key, defaultValue) as unknown as TypedReturn<ValType>
  return checkTypeGuard(value, defaultValue, customTypeGuard)
}

export function getDynamicConfigValue<
  Conf extends keyof DynamicConfigKeys,
  Key extends DynamicConfigKeys[Conf],
  ValType,
>(config: Conf, key: Key, defaultValue: ValType, customTypeGuard?: (x: unknown) => x is ValType): ValType {
  if (isInterface) {
    return defaultValue
  }
  const dynamicConfig = getStatsigClient().getDynamicConfig(config)
  const value = dynamicConfig.get(key, defaultValue) as unknown as TypedReturn<ValType>
  return checkTypeGuard(value, defaultValue, customTypeGuard)
}

export function getExperimentValueFromLayer<Layer extends string, Exp extends keyof ExperimentProperties, ValType>(
  layerName: Layer,
  param: ExperimentProperties[Exp],
  defaultValue: ValType,
  customTypeGuard?: (x: unknown) => x is ValType,
): ValType {
  const layer = getStatsigClient().getLayer(layerName)
  const value = layer.get(param, defaultValue)
  // we directly get param from layer; these are spread from experiments
  return checkTypeGuard(value, defaultValue, customTypeGuard)
}

export function useExperimentValueFromLayer<Layer extends string, Exp extends keyof ExperimentProperties, ValType>(
  layerName: Layer,
  param: ExperimentProperties[Exp],
  defaultValue: ValType,
  customTypeGuard?: (x: unknown) => x is ValType,
): ValType {
  const layer = useLayer(layerName)
  const value = layer.get(param, defaultValue)
  // we directly get param from layer; these are spread from experiments
  return checkTypeGuard(value as unknown as TypedReturn<ValType>, defaultValue, customTypeGuard)
}

export function checkTypeGuard<ValType>(
  value: TypedReturn<ValType>,
  defaultValue: ValType,
  customTypeGuard?: (x: unknown) => x is ValType,
): ValType {
  const isOfDefaultValueType = (val: unknown): val is ValType => typeof val === typeof defaultValue

  if (customTypeGuard?.(value) || isOfDefaultValueType(value)) {
    return value
  } else {
    return defaultValue
  }
}

export function useStatsigClientStatus(): {
  isStatsigLoading: boolean
  isStatsigReady: boolean
  isStatsigUninitialized: boolean
} {
  const { client } = useStatsigClient()
  const [statsigStatus, setStatsigStatus] = useState<StatsigLoadingStatus>(client.loadingStatus)

  useEffect(() => {
    const handler: StatsigClientEventCallback<'values_updated'> = (event) => {
      setStatsigStatus(event.status)
    }
    client.on('values_updated', handler)
    return () => {
      client.off('values_updated', handler)
    }
  }, [client])

  return useMemo(
    () => ({
      isStatsigLoading: statsigStatus === 'Loading',
      isStatsigReady: statsigStatus === 'Ready',
      isStatsigUninitialized: statsigStatus === 'Uninitialized',
    }),
    [statsigStatus],
  )
}
