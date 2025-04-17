import { StatsigClient } from '@statsig/react-bindings'
import { StatsigClientRN } from '@statsig/react-native-bindings'
import { config } from 'uniswap/src/config'
import { LocalOverrideAdapterWrapper } from 'uniswap/src/features/gating/LocalOverrideAdapterWrapper'

export {
  StatsigClient,
  StatsigOptions,
  StatsigUser,
  StorageProvider,
  TypedReturn,
} from '@statsig/react-native-bindings'

export {
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

let localOverrideAdapter: LocalOverrideAdapterWrapper

export const getOverrideAdapter = (): LocalOverrideAdapterWrapper => {
  if (!localOverrideAdapter) {
    localOverrideAdapter = new LocalOverrideAdapterWrapper(config.statsigApiKey)
  }
  return localOverrideAdapter
}

export const getStatsigClient = (): StatsigClient => StatsigClientRN.instance(config.statsigApiKey)
