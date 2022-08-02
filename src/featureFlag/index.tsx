import { createContext, ReactNode, useContext } from 'react'

interface FeatureFlagContextType {
  isLoaded: boolean
  flags?: Record<string, string>
}

const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined)

export function useFeatureFlagContext(): FeatureFlagContextType {
  const context = useContext(FeatureFlagContext)
  if (!context) {
    throw Error('Feature flag hooks can only be used by children of FeatureFlagProvider.')
  } else {
    return context
  }
}

export function FeatureFlagProvider({ children }: { children: ReactNode }) {
  const value = {
    isLoaded: true,
    flags: {
      phase0: 'control',
    },
  }
  return <FeatureFlagContext.Provider value={value}>{children}</FeatureFlagContext.Provider>
}

export function useFeatureFlagsLoaded(): boolean {
  return useFeatureFlagContext().isLoaded
}

// feature flag hooks

enum Phase0Variant {
  Control = 'Control',
  Enabled = 'Enabled',
}

export function usePhase0Flag(): Phase0Variant {
  const phase0Variant = useFeatureFlagContext().flags?.['phase0']
  switch (phase0Variant) {
    case 'enabled':
      return Phase0Variant.Enabled
    default:
      return Phase0Variant.Control
  }
}

enum Phase1Variant {
  Control = 'Control',
  Enabled = 'Enabled',
}

export function usePhase1Flag(): Phase1Variant {
  const phase1Variant = useFeatureFlagContext().flags?.['phase1']
  switch (phase1Variant) {
    case 'enabled':
      return Phase1Variant.Enabled
    default:
      return Phase1Variant.Control
  }
}
