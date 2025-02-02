import { ParsedQs, parse } from 'qs'
import { ReactNode, createContext, useContext, useMemo } from 'react'
import { useLocation } from 'react-router-dom'

interface UrlContext {
  useParsedQueryString: () => ParsedQs
}

export const UrlContext = createContext<UrlContext | null>(null)

function useParsedQueryString(): ParsedQs {
  const { search } = useLocation()
  return useMemo(() => {
    const hash = window.location.hash
    const query = search || hash.substr(hash.indexOf('?'))

    return query && query.length > 1 ? parse(query, { parseArrays: false, ignoreQueryPrefix: true }) : {}
  }, [search])
}

export function ReactRouterUrlProvider({ children }: { children: ReactNode | undefined }): JSX.Element {
  return <UrlContext.Provider value={{ useParsedQueryString }}>{children}</UrlContext.Provider>
}

export function BlankUrlProvider({ children }: { children: ReactNode | undefined }): JSX.Element {
  const value = useMemo(() => {
    return {
      useParsedQueryString: (): ParsedQs => {
        return {}
      },
    }
  }, [])
  return <UrlContext.Provider value={value}>{children}</UrlContext.Provider>
}

export function useUrlContext(): UrlContext {
  const context = useContext(UrlContext)
  if (!context) {
    throw new Error('useUrlContext must be used within a UrlProvider')
  }

  return context
}
