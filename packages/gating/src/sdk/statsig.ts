import { StatsigClient } from '@statsig/react-bindings'
import { getConfig } from '@universe/config'
import { LocalOverrideAdapterWrapper } from '@universe/gating/src/LocalOverrideAdapterWrapper'
import { isTestEnv } from 'utilities/src/environment/env'

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

let localOverrideAdapter: LocalOverrideAdapterWrapper | undefined

function getStatsigApiKeyOrThrow(): string {
  // A dummy key is used in test env b/c the wallet/mobile tests use this file instead of the statsig.native file
  const statsigApiKey = isTestEnv() ? 'dummy-test-key' : getConfig().statsigApiKey

  if (!statsigApiKey) {
    throw new Error('STATSIG_API_KEY is not set')
  }

  return statsigApiKey
}

export function getOverrideAdapter(): LocalOverrideAdapterWrapper {
  if (!localOverrideAdapter) {
    localOverrideAdapter = new LocalOverrideAdapterWrapper(getStatsigApiKeyOrThrow())
  }
  return localOverrideAdapter
}

export function getStatsigClient(): StatsigClient {
  return StatsigClient.instance(getStatsigApiKeyOrThrow())
}
