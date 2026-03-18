import { type StatsigClient } from '@statsig/react-bindings'
import { StatsigClientRN } from '@statsig/react-native-bindings'
import { getConfig } from '@universe/config'
import { LocalOverrideAdapterWrapper } from '@universe/gating/src/LocalOverrideAdapterWrapper'

const config = getConfig()

export type { StatsigOptions, StatsigUser, StorageProvider, TypedReturn } from '@statsig/react-native-bindings'
export {
  StatsigClient,
  StatsigContext,
  StatsigProviderRN as StatsigProvider,
  Storage,
  useClientAsyncInitRN as useClientAsyncInit,
  useDynamicConfig,
  useExperiment,
  useFeatureGate,
  useGateValue,
  useLayer,
  useStatsigClient,
  useStatsigUser,
} from '@statsig/react-native-bindings'

let localOverrideAdapter: LocalOverrideAdapterWrapper | undefined

export const getOverrideAdapter = (): LocalOverrideAdapterWrapper => {
  if (!localOverrideAdapter) {
    localOverrideAdapter = new LocalOverrideAdapterWrapper(config.statsigApiKey)
  }
  return localOverrideAdapter
}

export const getStatsigClient = (): StatsigClient => StatsigClientRN.instance(config.statsigApiKey)
