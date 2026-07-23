/* oxlint-disable react-hooks/rules-of-hooks -- Every hook in this file conditionally calls a Privy hook, and only when Privy is configured. `getPrivyConfig` reads the cached startup config, so each branch is constant for the app's lifetime. It mirrors MaybePrivyProvider, which mounts <PrivyProvider> on the exact same condition, so the Privy hooks only ever run when the provider is in the tree. */
/* oxlint-disable no-restricted-imports -- this module is the canonical home for the gated Privy hooks; everywhere else in the web app must use the `useMaybe*` wrappers below. */
import {
  type PrivyInterface,
  useAuthorizationSignature,
  useLoginWithEmail,
  useLoginWithOAuth,
  usePrivy,
} from '@privy-io/react-auth'
import { getPrivyConfig } from '~/config'

/**
 * Whether Privy is configured (PRIVY_APP_ID + PRIVY_CLIENT_ID are set). This is the single
 * source of truth shared by `MaybePrivyProvider` (which only mounts `<PrivyProvider>` when it's
 * true) and the `useMaybe*` hooks below. Privy hooks read provider-backed React contexts at
 * render time and throw when the provider is absent, so each hook is gated on this condition and
 * returns safe, non-throwing defaults when Privy is off. Use the wrappers instead of the raw hooks.
 */
export function isPrivyConfigured(): boolean {
  const { appId, clientId } = getPrivyConfig(false)
  return Boolean(appId && clientId)
}

const noop = async (): Promise<void> => {}

// ── usePrivy ──────────────────────────────────────────────────────────
type MaybePrivy = Pick<PrivyInterface, 'ready' | 'authenticated' | 'user' | 'logout' | 'getAccessToken'>

const UNCONFIGURED_PRIVY: MaybePrivy = {
  ready: false,
  authenticated: false,
  user: null,
  logout: noop,
  getAccessToken: async () => null,
}

export function useMaybePrivy(): MaybePrivy {
  if (!isPrivyConfigured()) {
    return UNCONFIGURED_PRIVY
  }
  return usePrivy()
}

// ── useLoginWithOAuth ─────────────────────────────────────────────────
type MaybeLoginWithOAuth = Pick<ReturnType<typeof useLoginWithOAuth>, 'initOAuth' | 'loading'>

const UNCONFIGURED_LOGIN_WITH_OAUTH: MaybeLoginWithOAuth = { initOAuth: noop, loading: false }

export function useMaybeLoginWithOAuth(callbacks?: Parameters<typeof useLoginWithOAuth>[0]): MaybeLoginWithOAuth {
  if (!isPrivyConfigured()) {
    return UNCONFIGURED_LOGIN_WITH_OAUTH
  }
  return useLoginWithOAuth(callbacks)
}

// ── useLoginWithEmail ─────────────────────────────────────────────────
type MaybeLoginWithEmail = Pick<ReturnType<typeof useLoginWithEmail>, 'sendCode' | 'loginWithCode'>

const UNCONFIGURED_LOGIN_WITH_EMAIL: MaybeLoginWithEmail = { sendCode: noop, loginWithCode: noop }

export function useMaybeLoginWithEmail(callbacks?: Parameters<typeof useLoginWithEmail>[0]): MaybeLoginWithEmail {
  if (!isPrivyConfigured()) {
    return UNCONFIGURED_LOGIN_WITH_EMAIL
  }
  return useLoginWithEmail(callbacks)
}

// ── useAuthorizationSignature ─────────────────────────────────────────
type MaybeAuthorizationSignature = Pick<ReturnType<typeof useAuthorizationSignature>, 'generateAuthorizationSignature'>

const UNCONFIGURED_AUTHORIZATION_SIGNATURE: MaybeAuthorizationSignature = {
  // Unreachable without Privy; fail loudly rather than fabricate a signature.
  generateAuthorizationSignature: async () => {
    throw new Error('Privy is not configured: cannot generate an authorization signature')
  },
}

export function useMaybeAuthorizationSignature(): MaybeAuthorizationSignature {
  if (!isPrivyConfigured()) {
    return UNCONFIGURED_AUTHORIZATION_SIGNATURE
  }
  return useAuthorizationSignature()
}
