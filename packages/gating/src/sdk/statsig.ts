import { StatsigClient } from '@statsig/react-bindings'
import { LocalOverrideAdapterWrapper } from '@universe/gating/src/LocalOverrideAdapterWrapper'

export {
  StatsigClient,
  StatsigContext,
  type StatsigOptions,
  StatsigProvider,
  type StatsigUser,
  Storage,
  type StorageProvider,
  type TypedReturn,
  useClientAsyncInit,
  useDynamicConfig,
  useExperiment,
  useFeatureGate,
  useGateValue,
  useLayer,
  useStatsigClient,
  useStatsigUser,
} from '@statsig/react-bindings'

// Use statsigApiKey from environment variables directly to avoid node dependency errors in cloudflare deploys
// Which happens when importing uniswap/src/config in this file
// A dummy key is used in test env b/c the wallet/mobile tests use this file instead of the statsig.native file
const statsigApiKey =
  process.env.NODE_ENV === 'test'
    ? 'dummy-test-key'
    : (process.env.REACT_APP_STATSIG_API_KEY ?? process.env.STATSIG_API_KEY)

if (!statsigApiKey) {
  throw new Error('STATSIG_API_KEY is not set')
}

let localOverrideAdapter: LocalOverrideAdapterWrapper | undefined

export const getOverrideAdapter = (): LocalOverrideAdapterWrapper => {
  if (!localOverrideAdapter) {
    localOverrideAdapter = new LocalOverrideAdapterWrapper(statsigApiKey)
  }
  return localOverrideAdapter
}
export const getStatsigClient = (): StatsigClient => StatsigClient.instance(statsigApiKey)
