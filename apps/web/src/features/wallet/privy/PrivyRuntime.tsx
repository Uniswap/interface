/* oxlint-disable no-restricted-imports -- the one sanctioned host of the raw Privy hooks; everything else reads the runtime store. */
import {
  PrivyProvider,
  useAuthorizationSignature,
  useLoginWithEmail,
  useLoginWithOAuth,
  usePrivy,
} from '@privy-io/react-auth'
import { useEffect } from 'react'
import { getPrivyConfig } from '~/config'
import { OAUTH_EVENT_FANOUT, publishPrivyRuntime } from '~/features/wallet/privy/privyRuntimeStore'

function PrivyRuntimeBridge(): null {
  const { ready, authenticated, user, logout, getAccessToken } = usePrivy()
  const { initOAuth, loading } = useLoginWithOAuth(OAUTH_EVENT_FANOUT)
  const { sendCode, loginWithCode } = useLoginWithEmail()
  const { generateAuthorizationSignature } = useAuthorizationSignature()

  useEffect(() => {
    publishPrivyRuntime({
      privy: { ready, authenticated, user, logout, getAccessToken },
      loginWithOAuth: { initOAuth, loading },
      loginWithEmail: { sendCode, loginWithCode },
      authorizationSignature: { generateAuthorizationSignature },
    })
  }, [
    ready,
    authenticated,
    user,
    logout,
    getAccessToken,
    initOAuth,
    loading,
    sendCode,
    loginWithCode,
    generateAuthorizationSignature,
  ])

  return null
}

/** Lazy chunk: <PrivyProvider> plus the bridge that publishes its hook results to the runtime store. */
export default function PrivyRuntime(): JSX.Element {
  const { appId, clientId } = getPrivyConfig(false)
  return (
    <PrivyProvider appId={appId} clientId={clientId} config={{ loginMethods: ['email', 'google', 'apple'] }}>
      <PrivyRuntimeBridge />
    </PrivyProvider>
  )
}
