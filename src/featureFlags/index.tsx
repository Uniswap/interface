import { atomWithStorage, useAtomValue, useUpdateAtom } from 'jotai/utils'
import { createContext, ReactNode, useCallback, useContext } from 'react'
import { useGate } from 'statsig-react'

/**
 * The value here must match the value in the statsig dashboard, if you plan to use statsig.
 */
export enum FeatureFlag {
  traceJsonRpc = 'traceJsonRpc',
  debounceSwapQuote = 'debounce_swap_quote',
  fallbackProvider = 'fallback_provider',
  uniswapXSyntheticQuote = 'uniswapx_synthetic_quote',
  uniswapXEthOutputEnabled = 'uniswapx_eth_output_enabled',
  uniswapXExactOutputEnabled = 'uniswapx_exact_output_enabled',
  multichainUX = 'multichain_ux',
  currencyConversion = 'currency_conversion',
  fotAdjustedmentsEnabled = 'fot_dynamic_adjustments_enabled',
  infoExplore = 'info_explore',
  infoTDP = 'info_tdp',
  infoPoolPage = 'info_pool_page',
  infoLiveViews = 'info_live_views',
  uniswapXDefaultEnabled = 'uniswapx_default_enabled',
  quickRouteMainnet = 'enable_quick_route_mainnet',
}

interface FeatureFlagsContextType {
  isLoaded: boolean
  flags: Record<string, string>
}

const FeatureFlagContext = createContext<FeatureFlagsContextType>({ isLoaded: false, flags: {} })

function useFeatureFlagsContext(): FeatureFlagsContextType {
  const context = useContext(FeatureFlagContext)
  if (!context) {
    throw Error('Feature flag hooks can only be used by children of FeatureFlagProvider.')
  } else {
    return context
  }
}

/* update and save feature flag settings */
export const featureFlagSettings = atomWithStorage<Record<string, string>>('featureFlags', {})

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

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  // TODO(vm): `isLoaded` to `true` so `App.tsx` will render. Later, this will be dependent on
  // flags loading from Amplitude, with a timeout.
  const featureFlags = useAtomValue(featureFlagSettings)
  const value = {
    isLoaded: true,
    flags: featureFlags,
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
