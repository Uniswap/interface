import type { PrecomputedEvaluationsInterface } from '@statsig/js-client'
import {
  StatsigClient,
  StatsigContext,
  StatsigProvider,
  Storage,
  useClientAsyncInit,
  useDynamicConfig as useDynamicConfigOriginal,
  useExperiment as useExperimentOriginal,
  useFeatureGate,
  useGateValue,
  useLayer as useLayerOriginal,
  useStatsigClient as useStatsigClientOriginal,
  useStatsigUser,
} from '@statsig/react-bindings'
import { LocalOverrideAdapterWrapper } from 'uniswap/src/features/gating/LocalOverrideAdapterWrapper'
import { isInterface } from 'utilities/src/platform'

export { StatsigClient } from '@statsig/react-bindings'
export type { StatsigOptions, StatsigUser, StorageProvider, TypedReturn } from '@statsig/react-bindings'

export { StatsigContext, StatsigProvider, Storage, useClientAsyncInit, useFeatureGate, useGateValue, useStatsigUser }

function stubUseDynamicConfig(name: string, _options?: unknown): ReturnType<typeof useDynamicConfigOriginal> {
  return {
    name,
    ruleID: '',
    details: { reason: 'Uninitialized', time: 0, __skipped: false },
    value: {},
    get: <T>(_: string, fallback?: T) => fallback as T,
    __evaluation: null,
  } as unknown as ReturnType<typeof useDynamicConfigOriginal>
}
export const useDynamicConfig = isInterface
  ? stubUseDynamicConfig
  : (useDynamicConfigOriginal as (name: string, options?: unknown) => ReturnType<typeof useDynamicConfigOriginal>)

function stubUseExperiment(name: string, _options?: unknown): ReturnType<typeof useExperimentOriginal> {
  return {
    name,
    ruleID: '',
    details: { reason: 'Uninitialized', time: 0, __skipped: false },
    value: {},
    groupName: null,
    __evaluation: null,
    get: <T>(_: string, fallback?: T) => fallback as T,
  } as unknown as ReturnType<typeof useExperimentOriginal>
}
export const useExperiment = isInterface
  ? stubUseExperiment
  : (useExperimentOriginal as (name: string, options?: unknown) => ReturnType<typeof useExperimentOriginal>)

function stubUseLayer(name: string, _options?: unknown): ReturnType<typeof useLayerOriginal> {
  return {
    name,
    ruleID: '',
    details: { reason: 'Uninitialized', time: 0, __skipped: false },
    groupName: null,
    __value: {},
    __evaluation: null,
    get: <T>(_: string, fallback?: T) => fallback as T,
  } as unknown as ReturnType<typeof useLayerOriginal>
}
export const useLayer = isInterface
  ? stubUseLayer
  : (useLayerOriginal as (name: string, options?: unknown) => ReturnType<typeof useLayerOriginal>)

function stubUseStatsigClient(): ReturnType<typeof useStatsigClientOriginal> {
  const stubClient = {
    loadingStatus: 'Uninitialized',
    on: () => undefined,
    off: () => undefined,
  } as unknown as PrecomputedEvaluationsInterface
  return { client: stubClient } as ReturnType<typeof useStatsigClientOriginal>
}
export const useStatsigClient = isInterface ? stubUseStatsigClient : useStatsigClientOriginal

// Use statsigApiKey from environment variables directly to avoid node dependency errors in cloudflare deploys
// Which happens when importing uniswap/src/config in this file
// A dummy key is used in test env b/c the wallet/mobile tests use this file instead of the statsig.native file
const statsigApiKey =
  process.env.NODE_ENV === 'test'
    ? 'dummy-test-key'
    : process.env.REACT_APP_STATSIG_API_KEY ?? process.env.STATSIG_API_KEY

if (!statsigApiKey) {
  throw new Error('STATSIG_API_KEY is not set')
}

let localOverrideAdapter: LocalOverrideAdapterWrapper

export const getOverrideAdapter = (): LocalOverrideAdapterWrapper => {
  if (!localOverrideAdapter) {
    localOverrideAdapter = new LocalOverrideAdapterWrapper(statsigApiKey)
  }
  return localOverrideAdapter
}
export const getStatsigClient = (): StatsigClient => StatsigClient.instance(statsigApiKey)
