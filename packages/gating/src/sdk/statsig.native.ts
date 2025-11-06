import { StatsigClient } from '@statsig/react-bindings'
import { StatsigClientRN } from '@statsig/react-native-bindings'
import { getConfig } from '@universe/config'
import { LocalOverrideAdapterWrapper } from '@universe/gating/src/LocalOverrideAdapterWrapper'

const config = getConfig()

export {
  StatsigClient,
  StatsigContext,
  StatsigOptions,
  StatsigProviderRN as StatsigProvider,
  StatsigUser,
  Storage,
  StorageProvider,
  TypedReturn,
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
