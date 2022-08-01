import { createContext, ReactNode, useContext } from 'react'

interface FeatureFlagContextType {
  isLoaded: boolean
  flags: Record<string, string>
}

const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined)

function useFeatureFlagContext() {
  const context = useContext(FeatureFlagContext)
  if (!context) throw Error('Feature flag hooks can only be used by children of FeatureFlagProvider.')
  return context
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

enum Phase0Variant {
  Control = 'Control',
  Enabled = 'Enabled',
}

export function useFeatureFlagsLoaded(): boolean {
  return useFeatureFlagContext().isLoaded
}

export function usePhase0Flag(): Phase0Variant {
  const phase0Variant = useFeatureFlagContext().flags['phase0']
  switch (phase0Variant) {
    case 'enabled':
      return Phase0Variant.Enabled
    default:
      return Phase0Variant.Control
  }
}
