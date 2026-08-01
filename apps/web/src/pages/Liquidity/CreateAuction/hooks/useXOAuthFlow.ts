import { GetXAuthUrlRequest } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/x_verification_pb'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { XVerificationClient } from 'uniswap/src/data/apiClients/liquidityService/XVerificationClient'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { useActiveAddress } from '~/features/accounts/store/hooks'
import { useCreateAuctionStoreActions } from '~/pages/Liquidity/CreateAuction/CreateAuctionContext'

type XOAuthMessage =
  | { type: 'x_oauth_success'; xHandle: string; xVerificationToken: string }
  | { type: 'x_oauth_error'; message: string }

export function useXOAuthFlow({ onVerified }: { onVerified?: () => void } = {}): {
  connectX: () => void
  isLoading: boolean
  error: string | null
} {
  const { t } = useTranslation()
  const address = useActiveAddress(Platform.EVM)
  const { setXVerification } = useCreateAuctionStoreActions()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const popupRef = useRef<Window | null>(null)

  // Listen for the OAuth result on a channel that outlives the popup. The callback posts its result and
  // then immediately closes the popup; under COOP `same-origin-allow-popups` (e.g. app.corn-staging.com)
  // the popup is in a separate browsing-context group and its message is delivered *after* the popup-closed
  // poller below fires. So this listener must NOT be torn down on popup close / loading end, or the late
  // cross-group message is dropped and the verification silently never lands.
  useEffect(() => {
    const channel = new BroadcastChannel('x_oauth')

    const handler = (event: MessageEvent<XOAuthMessage>) => {
      if (event.data.type === 'x_oauth_success') {
        // Bind to the address the token was issued for so a later wallet switch invalidates it. Without a
        // connected wallet there is no valid binding, so drop the result rather than store an unbound token.
        if (!address) {
          setError(t('toucan.createAuction.step.tokenInfo.xProfile.failedToInitiate'))
          setIsLoading(false)
          return
        }
        setXVerification({
          xHandle: event.data.xHandle,
          xVerificationToken: event.data.xVerificationToken,
          boundWalletAddress: address,
        })
        onVerified?.()
      } else {
        setError(event.data.message)
      }
      setIsLoading(false)
    }

    channel.addEventListener('message', handler)

    return () => {
      channel.removeEventListener('message', handler)
      channel.close()
    }
  }, [setXVerification, onVerified, address, t])

  // Reset loading if the user dismisses the popup without completing the flow. Deliberately does not touch
  // the channel above — a late success/error message can still arrive after the popup window closes.
  useEffect(() => {
    if (!isLoading) {
      return undefined
    }

    const interval = setInterval(() => {
      if (popupRef.current?.closed) {
        setIsLoading(false)
      }
    }, 500)

    return () => clearInterval(interval)
  }, [isLoading])

  const connectX = useCallback(() => {
    if (!address) {
      return
    }

    setError(null)
    setIsLoading(true)

    XVerificationClient.getXAuthUrl(new GetXAuthUrlRequest({ walletAddress: address }))
      .then(({ authUrl, state }) => {
        // Use localStorage, not sessionStorage: the OAuth popup opens cross-origin (x.com), and under
        // COOP `same-origin-allow-popups` (set on some deploys, e.g. app.corn-staging.com) it lands in a
        // separate browsing-context group with a fresh, unshared sessionStorage. localStorage is shared
        // across that boundary, so the callback can read the state back. Cleared on read in the callback.
        localStorage.setItem('x_oauth_state', state)

        const popup = window.open(authUrl, 'x_oauth', 'width=600,height=700')
        popupRef.current = popup

        if (!popup) {
          setIsLoading(false)
          setError(t('toucan.createAuction.step.tokenInfo.xProfile.popupBlocked'))
        }
      })
      .catch((err: unknown) => {
        setIsLoading(false)
        setError(
          err instanceof Error ? err.message : t('toucan.createAuction.step.tokenInfo.xProfile.failedToInitiate'),
        )
      })
  }, [address, t])

  return { connectX, isLoading, error }
}
