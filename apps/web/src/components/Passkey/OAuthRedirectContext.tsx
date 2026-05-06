import { createContext, useContext } from 'react'
import { isDevEnv } from 'utilities/src/environment/env'

const OAuthRedirectContext = createContext(false)

export const OAuthRedirectProvider = OAuthRedirectContext.Provider

export function useAssertOAuthRedirectRouter(): void {
  const mounted = useContext(OAuthRedirectContext)
  if (!mounted && isDevEnv()) {
    throw new Error('useOAuthResult requires OAuthRedirectProvider (useOAuthRedirectRouter) to be mounted above it')
  }
}
