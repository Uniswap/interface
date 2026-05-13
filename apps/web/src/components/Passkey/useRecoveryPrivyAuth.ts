import { useAuthorizationSignature, useLoginWithEmail, useLoginWithOAuth, usePrivy } from '@privy-io/react-auth'
import { useCallback } from 'react'
import type { RecoveryPrivyAuth } from 'uniswap/src/features/passkey/recoveryPrivyAuth'
import { useEvent } from 'utilities/src/react/hooks'
import { RECOVER_OAUTH_PENDING_KEY } from '~/components/Passkey/useOAuthRedirectRouter'
import { useOAuthResult } from '~/components/Passkey/useOAuthResult'

/**
 * Web implementation of {@link RecoveryPrivyAuth} — thin wrapper around `@privy-io/react-auth`
 * hooks plus the existing sessionStorage-based OAuth redirect plumbing.
 *
 * `onOAuthError` is exposed so the caller can surface failures from Privy's OAuth redirect
 * (denied consent, closed popup, etc.) that aren't captured by the normal flow state.
 */
export function useRecoveryPrivyAuth({
  onOAuthError,
}: { onOAuthError?: (err: string) => void } = {}): RecoveryPrivyAuth {
  const { ready, getAccessToken, user, logout } = usePrivy()
  const { sendCode, loginWithCode } = useLoginWithEmail()
  const { initOAuth: privyInitOAuth } = useLoginWithOAuth({
    onError: (e) => {
      sessionStorage.removeItem(RECOVER_OAUTH_PENDING_KEY)
      onOAuthError?.(typeof e === 'string' ? e : ((e as { message?: string }).message ?? 'OAuth error'))
    },
  })
  const { generateAuthorizationSignature } = useAuthorizationSignature()

  const oauthReturn = useOAuthResult(RECOVER_OAUTH_PENDING_KEY)

  // Privy's `sendCode` / `initOAuth` throw "Already logged in" if an authenticated
  // session exists. Drop the existing session so the recovery flow can start from a
  // clean state regardless of how the user arrived here.
  const ensureLoggedOut = useEvent(async (): Promise<void> => {
    if (user) {
      await logout()
    }
  })

  const sendEmailCode = useEvent(async (email: string): Promise<void> => {
    await ensureLoggedOut()
    await sendCode({ email })
  })

  const loginWithEmailCode = useEvent(async (code: string): Promise<void> => {
    await loginWithCode({ code })
  })

  const initOAuth = useEvent(async (provider: 'google' | 'apple'): Promise<void> => {
    await ensureLoggedOut()
    sessionStorage.setItem(RECOVER_OAUTH_PENDING_KEY, provider)
    await privyInitOAuth({ provider })
  })

  const clearOAuthReturn = useCallback(() => {
    sessionStorage.removeItem(RECOVER_OAUTH_PENDING_KEY)
  }, [])

  return {
    ready,
    getAccessToken,
    sendEmailCode,
    loginWithEmailCode,
    initOAuth,
    generateAuthorizationSignature: generateAuthorizationSignature as (
      payload: object,
    ) => Promise<{ signature: string }>,
    oauthReturn,
    clearOAuthReturn,
  }
}
