import { useAuthorizationSignature, useLoginWithEmail, useLoginWithOAuth, usePrivy } from '@privy-io/expo'
import { useCallback, useMemo } from 'react'
import type { RecoveryPrivyAuth } from 'uniswap/src/features/passkey/recoveryPrivyAuth'
import { useEvent } from 'utilities/src/react/hooks'

/**
 * Mobile implementation of {@link RecoveryPrivyAuth}. Wraps `@privy-io/expo` hooks.
 *
 * `useAuthorizationSignature` was added in Privy Expo 0.55.0 and matches the shape of the
 * web react-auth hook: `generateAuthorizationSignature(input)` where `input` is the Privy
 * API request envelope (`{ version, method, url, body, headers }`). The backend's recovery
 * signing payload is already in this shape, so the shared flow hook forwards it unchanged.
 */
export function useRecoveryPrivyAuth(): RecoveryPrivyAuth {
  const { user, isReady, getAccessToken, logout } = usePrivy()
  const { sendCode, loginWithCode } = useLoginWithEmail()
  const oauthHook = useLoginWithOAuth()
  const { generateAuthorizationSignature: privyGenerateAuthorizationSignature } = useAuthorizationSignature()

  // Privy's `sendCode` / `oauthHook.login` throw "Already logged in" if an
  // authenticated session exists. Drop the existing session so the recovery flow can
  // start from a clean state regardless of how the user arrived here.
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
    await oauthHook.login({ provider })
  })

  const generateAuthorizationSignature = useEvent(async (payload: object): Promise<{ signature: string }> => {
    // Cast is safe: the recovery signing payload comes from the backend already in the
    // `GenerateAuthorizationSignatureInput` shape (version/method/url/body/headers). Expo's
    // hook validates at runtime and throws if the shape is wrong, which surfaces clearly.
    const result = await privyGenerateAuthorizationSignature(
      payload as Parameters<typeof privyGenerateAuthorizationSignature>[0],
    )
    return { signature: result.signature }
  })

  // Privy Expo drives OAuth via an in-app browser and updates `user` when it completes.
  // We infer OAuth return by checking for a linked provider account. The shared flow
  // hook's `pending` semantics don't apply to mobile (no full-page reload), so we always
  // report `pending: false`.
  //
  // Only one provider is linked per recovery session because `ensureLoggedOut()` runs
  // before each `initOAuth()` call, so the google/apple ordering below is just a
  // tiebreaker for a degenerate case (both linked) that shouldn't happen in practice.
  const oauthReturn = useMemo(() => {
    const accounts = (user as { linked_accounts?: Array<{ type?: string; email?: string }> } | null | undefined)
      ?.linked_accounts
    const google = accounts?.find((a) => a.type === 'google_oauth')
    const apple = accounts?.find((a) => a.type === 'apple_oauth')
    if (google) {
      return { pending: false, provider: 'google' as const, providerEmail: google.email }
    }
    if (apple) {
      return { pending: false, provider: 'apple' as const, providerEmail: apple.email }
    }
    return { pending: false, provider: null, providerEmail: undefined }
  }, [user])

  const clearOAuthReturn = useCallback(() => {
    // No-op: mobile OAuth state is derived from the Privy user object.
  }, [])

  return {
    ready: isReady,
    getAccessToken,
    sendEmailCode,
    loginWithEmailCode,
    initOAuth,
    generateAuthorizationSignature,
    oauthReturn,
    clearOAuthReturn,
  }
}
