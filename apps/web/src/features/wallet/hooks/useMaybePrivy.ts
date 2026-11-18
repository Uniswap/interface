import { useEffect, useSyncExternalStore } from 'react'
import { useEvent } from 'utilities/src/react/hooks'
import { getPrivyConfig } from '~/config'
import {
  getPrivyRuntimeSnapshot,
  type LoginWithOAuthCallbacks,
  type MaybeAuthorizationSignature,
  type MaybeLoginWithEmail,
  type MaybeLoginWithOAuth,
  type MaybePrivy,
  type PrivyRuntimeSnapshot,
  registerLoginWithOAuthCallbacks,
  subscribeToPrivyRuntime,
} from '~/features/wallet/privy/privyRuntimeStore'

/**
 * Whether Privy is configured (PRIVY_APP_ID + PRIVY_CLIENT_ID). `MaybePrivyProvider` loads the
 * Privy runtime only when this is true; the hooks below serve inactive defaults until it publishes.
 */
export function isPrivyConfigured(): boolean {
  const { appId, clientId } = getPrivyConfig(false)
  return Boolean(appId && clientId)
}

function usePrivyRuntimeSnapshot(): PrivyRuntimeSnapshot {
  return useSyncExternalStore(subscribeToPrivyRuntime, getPrivyRuntimeSnapshot)
}

export function useMaybePrivy(): MaybePrivy {
  return usePrivyRuntimeSnapshot().privy
}

export function useMaybeLoginWithOAuth(callbacks?: LoginWithOAuthCallbacks): MaybeLoginWithOAuth {
  const onComplete = useEvent((...args: Parameters<NonNullable<LoginWithOAuthCallbacks['onComplete']>>) =>
    callbacks?.onComplete?.(...args),
  )
  const onError = useEvent((...args: Parameters<NonNullable<LoginWithOAuthCallbacks['onError']>>) =>
    callbacks?.onError?.(...args),
  )

  useEffect(() => registerLoginWithOAuthCallbacks({ onComplete, onError }), [onComplete, onError])

  return usePrivyRuntimeSnapshot().loginWithOAuth
}

export function useMaybeLoginWithEmail(): MaybeLoginWithEmail {
  return usePrivyRuntimeSnapshot().loginWithEmail
}

export function useMaybeAuthorizationSignature(): MaybeAuthorizationSignature {
  return usePrivyRuntimeSnapshot().authorizationSignature
}
