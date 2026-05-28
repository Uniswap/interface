import { PrivyProvider } from '@privy-io/expo'
import { getConfig } from 'src/config'

/**
 * Returns the Privy app ID and client ID from the config.
 * Each environment (.env.defaults, .env.defaults.local) sets the appropriate
 * PRIVY_APP_ID and PRIVY_CLIENT_ID for that build flavor (prod/beta/dev).
 */
export function getPrivyConfig(): { appId: string; clientId: string } {
  const { privyAppId, privyClientId } = getConfig()
  return { appId: privyAppId ?? '', clientId: privyClientId ?? '' }
}

/**
 * Wraps children with PrivyProvider for the recovery-based graduation flow (email / OAuth
 * + PIN on onboarding). Keeps the dependency on Privy Expo scoped to a single mount point.
 *
 * If either ID is missing, renders children unwrapped. Any descendant calling Privy hooks
 * will throw, so callers must gate their entry points on having a configured tenant. The
 * recovery flow does this via the same feature flags that gate `RecoveryFlowScreen`.
 */
export function PrivyProviderWrapper({ children }: { children: React.ReactNode }): JSX.Element {
  const { appId, clientId } = getPrivyConfig()
  if (!appId || !clientId) {
    return <>{children}</>
  }
  return (
    <PrivyProvider appId={appId} clientId={clientId}>
      {children}
    </PrivyProvider>
  )
}
