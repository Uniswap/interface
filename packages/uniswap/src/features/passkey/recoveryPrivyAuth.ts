/**
 * Privy auth surface that `useRecoveryFlow` depends on. Each app wires its own
 * `useRecoveryPrivyAuth` hook that returns this shape:
 *   - `apps/web/src/components/Passkey/useRecoveryPrivyAuth.ts` uses `@privy-io/react-auth`
 *   - `apps/mobile/.../useRecoveryPrivyAuth.ts` uses `@privy-io/expo`
 *
 * Both surfaces (web app + extension pop-up at app.uniswap.org) share the web
 * implementation. Only the interface lives here so the shared state machine has a
 * stable contract without taking on Privy SDK packages as transitive dependencies.
 */
export interface RecoveryPrivyAuth {
  ready: boolean
  /** Privy user id of the re-authed session. Needed by the passkey-less rotation Challenge. */
  privyUserId?: string
  getAccessToken: () => Promise<string | null>
  sendEmailCode: (email: string) => Promise<void>
  loginWithEmailCode: (code: string) => Promise<void>
  initOAuth: (provider: 'google' | 'apple') => Promise<void>
  generateAuthorizationSignature: (payload: object) => Promise<{ signature: string }>
  /**
   * Fetches an encrypted authorization key blob from Privy. Provided by the platform
   * because mobile uses the `useGetEncryptedAuthorizationKey` hook from `@privy-io/expo`
   * (which handles PAT-based auth internally), while web hits the REST endpoint directly.
   */
  fetchEncryptedBlob: (params: { accessToken: string; keyId: string; privyAppId: string }) => Promise<string>
  /**
   * OAuth return state. `pending: true` while Privy is still exchanging the OAuth code;
   * resolves to `{ provider, providerEmail }` on success, or `{ provider: null }` if
   * the user abandoned the redirect.
   */
  oauthReturn: {
    pending: boolean
    provider: 'google' | 'apple' | null
    providerEmail: string | undefined
  }
  /** Clears the oauth-pending session state after the flow consumes the return. */
  clearOAuthReturn: () => void
}
