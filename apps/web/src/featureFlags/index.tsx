import useParsedQueryString from 'hooks/useParsedQueryString'
import { atomWithStorage, useAtomValue, useUpdateAtom } from 'jotai/utils'
import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo } from 'react'
import { useGate } from 'statsig-react'
import { isDevelopmentEnv, isStagingEnv } from 'utils/env'

/**
 * The value here must match the value in the statsig dashboard, if you plan to use statsig.
 */
export enum FeatureFlag {
  realtime = 'realtime',
  traceJsonRpc = 'traceJsonRpc',
  fallbackProvider = 'fallback_provider',
  uniswapXSyntheticQuote = 'uniswapx_synthetic_quote',
  multichainUX = 'multichain_ux',
  currencyConversion = 'currency_conversion',
  quickRouteMainnet = 'enable_quick_route_mainnet',
  limitsEnabled = 'limits_enabled',
  eip6963Enabled = 'eip6963_enabled',
  gatewayDNSUpdate = 'gateway_dns_update',
  sendEnabled = 'swap_send',
  gatewayDNSUpdateAll = 'gateway_dns_update_all',
  uniconV2 = 'unicon_V2',
  limitsFees = 'limits_fees',
  exitAnimation = 'exit_animation',
  v2Everywhere = 'v2_everywhere',
  gqlTokenLists = 'gql_token_lists',
  // TODO(WEB-3625): Remove these once we have a generalized system for outage banners.
  outageBannerOptimism = 'outage_banner_feb_2024_optimism',
  outageBannerArbitrum = 'outage_banner_feb_2024_arbitrum',
  outageBannerPolygon = 'outage_banner_feb_2024_polygon',
}

interface FeatureFlagsContextType {
  isLoaded: boolean
  flags: Record<string, string>
  configs: Record<string, any>
}

const FeatureFlagContext = createContext<FeatureFlagsContextType>({ isLoaded: false, flags: {}, configs: {} })

export function useFeatureFlagsContext(): FeatureFlagsContextType {
  const context = useContext(FeatureFlagContext)
  if (!context) {
    throw Error('Feature flag hooks can only be used by children of FeatureFlagProvider.')
  } else {
    return context
  }
}

/* update and save feature flag & dynamic config settings */
export const featureFlagSettings = atomWithStorage<Record<string, string>>('featureFlags', {})
export const dynamicConfigSettings = atomWithStorage<Record<string, any>>('dynamicConfigs', {})

export function useUpdateFlag() {
  const setFeatureFlags = useUpdateAtom(featureFlagSettings)

  return useCallback(
    (featureFlag: string, option: string) => {
      setFeatureFlags((featureFlags) => ({
        ...featureFlags,
        [featureFlag]: option,
      }))
    },
    [setFeatureFlags]
  )
}

export function useUpdateConfig() {
  const setConfigs = useUpdateAtom(dynamicConfigSettings)

  return useCallback(
    (configName: string, option: any) => {
      setConfigs((configs) => ({
        ...configs,
        [configName]: option,
      }))
    },
    [setConfigs]
  )
}

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  // TODO: `isLoaded` to `true` so `App.tsx` will render. Later, this will be dependent on
  // flags loading from Amplitude, with a timeout.
  const featureFlags = useAtomValue(featureFlagSettings)
  const dynamicConfigs = useAtomValue(dynamicConfigSettings)
  const value = {
    isLoaded: true,
    flags: featureFlags,
    configs: dynamicConfigs,
  }
  return <FeatureFlagContext.Provider value={value}>{children}</FeatureFlagContext.Provider>
}

export function useFeatureFlagsIsLoaded(): boolean {
  return useFeatureFlagsContext().isLoaded
}

export enum BaseVariant {
  Control = 'control',
  Enabled = 'enabled',
}

export function useBaseFlag(flag: string, defaultValue = BaseVariant.Control): BaseVariant {
  const { value: statsigValue } = useGate(flag) // non-existent gates return false
  const featureFlagsContext = useFeatureFlagsContext()
  if (statsigValue) {
    return BaseVariant.Enabled
  }
  switch (featureFlagsContext.flags[flag]) {
    case 'enabled':
      return BaseVariant.Enabled
    case 'control':
      return BaseVariant.Control
    default:
      return defaultValue
  }
}

export function useFeatureFlagURLOverrides() {
  const parsedQs = useParsedQueryString()
  const setFeatureFlags = useUpdateAtom(featureFlagSettings)

  const newFeatureFlagObj = useMemo(() => {
    const featureFlagOverrides =
      typeof parsedQs.featureFlagOverride === 'string' ? parsedQs.featureFlagOverride.split(',') : []
    return featureFlagOverrides.reduce(
      (prev, current) => ({
        ...prev,
        [current]: BaseVariant.Enabled,
      }),
      {}
    )
  }, [parsedQs])

  useEffect(() => {
    if (!isDevelopmentEnv() && !isStagingEnv()) return

    setFeatureFlags((prev) => ({
      ...prev,
      ...newFeatureFlagObj,
    }))
  }, [newFeatureFlagObj, setFeatureFlags])
}
