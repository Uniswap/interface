import { useAtom } from 'jotai'
import { atomWithStorage, useAtomValue } from 'jotai/utils'
import { createContext, ReactNode, useCallback, useContext } from 'react'

interface FeatureFlagsContextType {
  isLoaded: boolean
  flags: Record<string, string>
}

const FeatureFlagContext = createContext<FeatureFlagsContextType>({ isLoaded: false, flags: {} })

export function useFeatureFlagsContext(): FeatureFlagsContextType {
  const context = useContext(FeatureFlagContext)
  if (!context) {
    throw Error('Feature flag hooks can only be used by children of FeatureFlagProvider.')
  } else {
    return context
  }
}

export enum Flags {
  phase0 = 'control',
  phase1 = 'control',
}
/* update and save feature flag settings */
export const featureFlagSettings = atomWithStorage<Record<string, string>>('featureFlags', Flags)
export function useFeatureFlagToggle(featureFlag: string) {
  const [featureFlags, setFeatureFlags] = useAtom(featureFlagSettings)

  return useCallback(() => {
    const curFeatureFlagSetting = featureFlags[featureFlag]
    featureFlags[featureFlag] = curFeatureFlagSetting === 'enabled' ? 'control' : 'enabled'
    console.log(featureFlags)
    setFeatureFlags(featureFlags)
  }, [featureFlags, setFeatureFlags, featureFlag])
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
  Control = 'Control',
  Enabled = 'Enabled',
}

export function useBaseFlag(flag: string): BaseVariant {
  switch (useFeatureFlagsContext().flags[flag]) {
    case 'enabled':
      return BaseVariant.Enabled
    case 'control':
    default:
      return BaseVariant.Control
  }
}
