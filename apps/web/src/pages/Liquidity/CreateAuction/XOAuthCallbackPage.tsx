import { VerifyXCallbackRequest } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/x_verification_pb'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { XVerificationClient } from 'uniswap/src/data/apiClients/liquidityService/XVerificationClient'

type CallbackState = 'loading' | 'success' | 'error'

export function XOAuthCallbackPage() {
  const { t } = useTranslation()
  const [callbackState, setCallbackState] = useState<CallbackState>('loading')
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const state = params.get('state')

    // Consume the URL params immediately. If React Strict Mode re-runs this effect,
    // the second mount reads an empty URL and exits early — preventing a duplicate
    // request with an already-spent one-time-use OAuth code.
    window.history.replaceState({}, '', window.location.pathname)

    if (!code || !state) {
      // URL already cleared or direct navigation — do nothing.
      return
    }

    // Paired with the localStorage write in useXOAuthFlow — sessionStorage isn't shared with this popup
    // when it runs in an isolated browsing-context group under COOP (see the comment there).
    const storedState = localStorage.getItem('x_oauth_state')
    localStorage.removeItem('x_oauth_state')

    if (state !== storedState) {
      const message = 'State mismatch — possible CSRF attack'
      setErrorMessage(message)
      setCallbackState('error')
      window.opener?.postMessage({ type: 'x_oauth_error', message }, window.location.origin)
      window.close()
      return
    }

    const channel = new BroadcastChannel('x_oauth')

    XVerificationClient.verifyXCallback(new VerifyXCallbackRequest({ code, state }))
      .then((response) => {
        setCallbackState('success')
        channel.postMessage({
          type: 'x_oauth_success',
          xHandle: response.xHandle,
          xVerificationToken: response.xVerificationToken,
        })
        channel.close()
        window.close()
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Verification failed'
        setErrorMessage(message)
        setCallbackState('error')
        channel.postMessage({ type: 'x_oauth_error', message })
        channel.close()
        window.close()
      })
  }, [])

  return (
    <Flex flex={1} alignItems="center" justifyContent="center" gap="$spacing12">
      {callbackState === 'loading' && (
        <Text variant="body1" color="$neutral2">
          {t('toucan.createAuction.step.tokenInfo.xProfile.connecting')}
        </Text>
      )}
      {callbackState === 'error' && (
        <Text variant="body1" color="$statusCritical">
          {errorMessage || t('toucan.createAuction.step.tokenInfo.xProfile.error')}
        </Text>
      )}
    </Flex>
  )
}

export default XOAuthCallbackPage
