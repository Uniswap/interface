import { createContext, ReactNode, useContext } from 'react'

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

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  // TODO(vm): `isLoaded` to `true` so `App.tsx` will render. Later, this will be dependent on
  // flags loading from Amplitude, with a timeout.
  const variant = process.env.NODE_ENV === 'development' ? 'enabled' : 'control'
  const value = {
    isLoaded: true,
    flags: {
      phase0: variant,
      phase1: variant,
    },
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
