import { createContext, PropsWithChildren, useContext } from 'react'

interface AnalyticsNavigationContext {
  useIsPartOfNavigationTree(): boolean
  shouldLogScreen(direct?: boolean, screen?: string): boolean
}

const defaultState: AnalyticsNavigationContext = {
  useIsPartOfNavigationTree: () => false,
  shouldLogScreen: (_direct?: boolean, _screen?: string) => false,
}

const context = createContext(defaultState)

export const useAnalyticsNavigationContext = (): AnalyticsNavigationContext => useContext(context)

export function AnalyticsNavigationContextProvider({
  useIsPartOfNavigationTree,
  shouldLogScreen,
  children,
}: PropsWithChildren<AnalyticsNavigationContext>): JSX.Element {
  return (
    <context.Provider value={{ useIsPartOfNavigationTree, shouldLogScreen }}>
      {children}
    </context.Provider>
  )
}
