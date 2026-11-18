/* oxlint-disable no-restricted-imports -- type-only imports; the Privy SDK itself loads only in PrivyRuntime's lazy chunk. */
import type {
  PrivyInterface,
  useAuthorizationSignature,
  useLoginWithEmail,
  useLoginWithOAuth,
} from '@privy-io/react-auth'

export type MaybePrivy = Pick<PrivyInterface, 'ready' | 'authenticated' | 'user' | 'logout' | 'getAccessToken'>
export type MaybeLoginWithOAuth = Pick<ReturnType<typeof useLoginWithOAuth>, 'initOAuth' | 'loading'>
export type MaybeLoginWithEmail = Pick<ReturnType<typeof useLoginWithEmail>, 'sendCode' | 'loginWithCode'>
export type MaybeAuthorizationSignature = Pick<
  ReturnType<typeof useAuthorizationSignature>,
  'generateAuthorizationSignature'
>
export type LoginWithOAuthCallbacks = NonNullable<Parameters<typeof useLoginWithOAuth>[0]>

export interface PrivyRuntimeSnapshot {
  privy: MaybePrivy
  loginWithOAuth: MaybeLoginWithOAuth
  loginWithEmail: MaybeLoginWithEmail
  authorizationSignature: MaybeAuthorizationSignature
}

const noop = async (): Promise<void> => {}

/** Served while Privy is unconfigured or its lazy chunk hasn't loaded; matches Privy's own pre-init `ready: false`. */
export const INACTIVE_PRIVY_RUNTIME: PrivyRuntimeSnapshot = {
  privy: {
    ready: false,
    authenticated: false,
    user: null,
    logout: noop,
    getAccessToken: async () => null,
  },
  loginWithOAuth: { initOAuth: noop, loading: false },
  loginWithEmail: { sendCode: noop, loginWithCode: noop },
  authorizationSignature: {
    // Unreachable without Privy; fail loudly rather than fabricate a signature.
    generateAuthorizationSignature: async () => {
      throw new Error('Privy is not available: cannot generate an authorization signature')
    },
  },
}

let snapshot: PrivyRuntimeSnapshot = INACTIVE_PRIVY_RUNTIME
const snapshotListeners = new Set<() => void>()

export function getPrivyRuntimeSnapshot(): PrivyRuntimeSnapshot {
  return snapshot
}

export function subscribeToPrivyRuntime(listener: () => void): () => void {
  snapshotListeners.add(listener)
  return () => {
    snapshotListeners.delete(listener)
  }
}

export function publishPrivyRuntime(next: PrivyRuntimeSnapshot): void {
  snapshot = next
  for (const listener of snapshotListeners) {
    listener()
  }
}

const oauthCallbackRegistry = new Set<LoginWithOAuthCallbacks>()

export function registerLoginWithOAuthCallbacks(callbacks: LoginWithOAuthCallbacks): () => void {
  oauthCallbackRegistry.add(callbacks)
  return () => {
    oauthCallbackRegistry.delete(callbacks)
  }
}

/** Privy fires OAuth callbacks on every mounted `useLoginWithOAuth`; the one hosted instance fans out the same way. */
export const OAUTH_EVENT_FANOUT: LoginWithOAuthCallbacks = {
  onComplete: (params) => {
    for (const callbacks of oauthCallbackRegistry) {
      callbacks.onComplete?.(params)
    }
  },
  onError: (error) => {
    for (const callbacks of oauthCallbackRegistry) {
      callbacks.onError?.(error)
    }
  },
}
