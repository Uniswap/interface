import { ParsedQs } from 'qs'
import { createContext, ReactNode, useContext, useMemo } from 'react'

export interface UrlContext {
  useParsedQueryString: () => ParsedQs
  usePathname: () => string
}

export const UrlContext = createContext<UrlContext | null>(null)

export function BlankUrlProvider({ children }: { children: ReactNode | undefined }): JSX.Element {
  const value = useMemo(() => {
    return {
      useParsedQueryString: (): ParsedQs => {
        return {}
      },
      usePathname: (): string => {
        return ''
      },
    }
  }, [])
  return <UrlContext.Provider value={value}>{children}</UrlContext.Provider>
}

export function ReactRouterUrlProvider(_: { children: ReactNode | undefined }): JSX.Element {
  throw new Error('ReactRouterUrlProvider is not supported on native')
}

export function useUrlContext(): UrlContext {
  const context = useContext(UrlContext)
  if (!context) {
    throw new Error('useUrlContext must be used within a UrlProvider')
  }

  return context
}
