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

export function useXOAuthFlow(): { connectX: () => void; isLoading: boolean; error: string | null } {
  const { t } = useTranslation()
  const address = useActiveAddress(Platform.EVM)
  const { setXVerification } = useCreateAuctionStoreActions()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const popupRef = useRef<Window | null>(null)

  // Poll for popup closed without a message (user dismissed), and manage the BroadcastChannel lifetime.
  useEffect(() => {
    if (!isLoading) {
      return undefined
    }

    const channel = new BroadcastChannel('x_oauth')

    const handler = (event: MessageEvent<XOAuthMessage>) => {
      if (event.data.type === 'x_oauth_success') {
        setXVerification({ xHandle: event.data.xHandle, xVerificationToken: event.data.xVerificationToken })
      } else {
        setError(event.data.message)
      }
      setIsLoading(false)
    }

    channel.addEventListener('message', handler)

    const interval = setInterval(() => {
      if (popupRef.current?.closed) {
        setIsLoading(false)
      }
    }, 500)

    return () => {
      clearInterval(interval)
      channel.removeEventListener('message', handler)
      channel.close()
    }
  }, [isLoading, setXVerification])

  const connectX = useCallback(() => {
    if (!address) {
      return
    }

    setError(null)
    setIsLoading(true)

    XVerificationClient.getXAuthUrl(new GetXAuthUrlRequest({ walletAddress: address }))
      .then(({ authUrl, state }) => {
        sessionStorage.setItem('x_oauth_state', state)

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
