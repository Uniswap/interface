import { atomWithStorage, useAtomValue, useUpdateAtom } from 'jotai/utils'
import { createContext, ReactNode, useCallback, useContext } from 'react'
import { useGate } from 'statsig-react'

/**
 * The value here must match the value in the statsig dashboard, if you plan to use statsig.
 */
export enum FeatureFlag {
  traceJsonRpc = 'traceJsonRpc',
  permit2 = 'permit2',
  fiatOnRampButtonOnSwap = 'fiat_on_ramp_button_on_swap_page',
  detailsV2 = 'details_v2',
  debounceSwapQuote = 'debounce_swap_quote',
  uniswapXEnabled = 'uniswapx_enabled',
  uniswapXSyntheticQuote = 'uniswapx_synthetic_quote',
  routingAPIPrice = 'routing_api_price',
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
