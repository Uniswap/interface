import { createContext, ReactNode, useContext } from 'react'

interface FeatureFlagContextType {
  isLoaded: boolean
}

const DEFAULT_STATE = { isLoaded: false }
const FeatureFlagContext = createContext<FeatureFlagContextType>(DEFAULT_STATE)

export function FeatureFlagProvider({ children }: { children: ReactNode }) {
  return <FeatureFlagContext.Provider value={{ isLoaded: false }}>{children}</FeatureFlagContext.Provider>
}

enum Phase0Flag {
  Control = 'Control',
  Enabled = 'Enabled',
}

export function usePhase0Flag(): Phase0Flag {
  const context = useContext(FeatureFlagContext)
  if (!context) throw Error('Feature flag hooks can only be used by children of FeatureFlagProvider.')
  return Phase0Flag.Control
}
