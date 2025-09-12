import { ParsedQs } from 'qs'
import { createContext, ReactNode } from 'react'

export interface UrlContext {
  useParsedQueryString: () => ParsedQs
  usePathname: () => string
}

export const UrlContext = createContext<UrlContext | null>(null)

export function ReactRouterUrlProvider(_: { children: ReactNode | undefined }): JSX.Element {
  throw new Error('Implemented in `.native.tsx` and `.web.tsx` files')
}

export function BlankUrlProvider(_: { children: ReactNode | undefined }): JSX.Element {
  throw new Error('Implemented in `.native.tsx` and `.web.tsx` files')
}

export function useUrlContext(): UrlContext {
  throw new Error('Implemented in `.native.tsx` and `.web.tsx` files')
}
