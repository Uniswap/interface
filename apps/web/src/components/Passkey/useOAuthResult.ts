import { usePrivy } from '@privy-io/react-auth'
import { useEffect, useState } from 'react'
import { useAssertOAuthRedirectRouter } from '~/components/Passkey/OAuthRedirectContext'

interface OAuthReturnResult {
  provider: 'google' | 'apple' | null
  providerEmail: string | undefined
  pending: boolean
}

const INITIAL_STATE: OAuthReturnResult = { provider: null, providerEmail: undefined, pending: false }

// Privy reports `ready: true` before the OAuth code exchange completes, so abandonment
// must come from a timer rather than `ready && !authenticated`.
const ABANDON_TIMEOUT_MS = 10_000

export function useOAuthResult(sessionStorageKey: string): OAuthReturnResult {
  useAssertOAuthRedirectRouter()

  const { ready, authenticated, user } = usePrivy()

  // Capture once at mount from sessionStorage AND the `privy_oauth_provider` URL param.
  // The URL fallback covers flows without `useOAuthRedirectRouter` and the case where
  // `useLoginWithOAuth.onError` clears sessionStorage mid-mount.
  const [initialPendingProvider] = useState<'google' | 'apple' | null>(() => {
    const stored = sessionStorage.getItem(sessionStorageKey) as 'google' | 'apple' | null
    const fromUrl = new URLSearchParams(window.location.search).get('privy_oauth_provider') as 'google' | 'apple' | null
    return stored ?? fromUrl
  })

  const [result, setResult] = useState<OAuthReturnResult>(() =>
    initialPendingProvider ? { provider: null, providerEmail: undefined, pending: true } : INITIAL_STATE,
  )

  useEffect(() => {
    if (!initialPendingProvider || !ready || !authenticated || !user) {
      return
    }

    const linkedAccount = initialPendingProvider === 'google' ? user.google : user.apple
    if (!linkedAccount) {
      return
    }

    const providerEmail = linkedAccount.email
    sessionStorage.removeItem(sessionStorageKey)
    setResult({ provider: initialPendingProvider, providerEmail, pending: false })
  }, [sessionStorageKey, initialPendingProvider, ready, authenticated, user])

  // Falls through to abandonment if success never arrives. The success effect clears
  // sessionStorage so the timer's existence check short-circuits on success.
  useEffect(() => {
    if (!initialPendingProvider) {
      return undefined
    }

    const timer = setTimeout(() => {
      if (sessionStorage.getItem(sessionStorageKey)) {
        sessionStorage.removeItem(sessionStorageKey)
        setResult(INITIAL_STATE)
      }
    }, ABANDON_TIMEOUT_MS)

    return () => clearTimeout(timer)
  }, [sessionStorageKey, initialPendingProvider])

  return result
}
