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
  const value = {
    isLoaded: true,
    flags: {
      phase0: 'control',
      phase1: 'control',
    },
  }
  return <FeatureFlagContext.Provider value={value}>{children}</FeatureFlagContext.Provider>
}

export function useFeatureFlagsIsLoaded(): boolean {
  return useFeatureFlagsContext().isLoaded
}

// feature flag hooks

enum Phase0Variant {
  Control = 'Control',
  Enabled = 'Enabled',
}

export function usePhase0Flag(): Phase0Variant {
  switch (useFeatureFlagsContext().flags['phase0']) {
    case 'enabled':
      return Phase0Variant.Enabled
    case 'control':
    default:
      return Phase0Variant.Control
  }
}

enum Phase1Variant {
  Control = 'Control',
  Enabled = 'Enabled',
}

export function usePhase1Flag(): Phase1Variant {
  switch (useFeatureFlagsContext().flags['phase1']) {
    case 'enabled':
      return Phase1Variant.Enabled
    case 'control':
    default:
      return Phase1Variant.Control
  }
}
