import { createContext, ReactNode, useContext } from 'react'

interface FeatureFlagContextType {
  isLoaded: boolean
  flags: Record<string, string>
}

const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined)

export function useFeatureFlagContext() {
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
