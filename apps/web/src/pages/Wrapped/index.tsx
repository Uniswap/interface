import { DisconnectedState } from 'pages/Wrapped/DisconnectedState'
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { useAppDispatch } from 'state/hooks'
import { Flex } from 'ui/src'
import { WRAPPED_PATH } from 'uniswap/src/components/banners/shared/utils'
import { useUrlContext } from 'uniswap/src/contexts/UrlContext'
import { useActiveAddresses } from 'uniswap/src/features/accounts/store/hooks'
import { setHasDismissedUniswapWrapped2025Banner } from 'uniswap/src/features/behaviorHistory/slice'
import { isAddress } from 'viem'

export default function Wrapped() {
  const { useParsedQueryString } = useUrlContext()
  const queryParams = useParsedQueryString()
  const walletAddressRef = useRef<string | undefined>(undefined)
  const backupWalletAddress = useActiveAddresses().evmAddress
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const containerRef = useRef<HTMLDivElement>(null)

  // clear the query params after storing the wallet address
  useEffect(() => {
    const addressFromQuery = queryParams.address as string
    if (addressFromQuery) {
      if (isAddress(addressFromQuery)) {
        walletAddressRef.current = addressFromQuery
      }
      navigate(WRAPPED_PATH, { replace: true })
    }
  }, [queryParams.address, navigate])

  // no longer show promo banner after viewing wrapped page
  useEffect(() => {
    dispatch(setHasDismissedUniswapWrapped2025Banner(true))
  }, [dispatch])

  const hasWallet = Boolean(walletAddressRef.current || backupWalletAddress)
  const walletAddress = walletAddressRef.current || backupWalletAddress
  const iframeUrl = `https://wrapped.uniswap.org${walletAddress ? `?address=${walletAddress}` : ''}`

  return (
    <Flex
      width="100vw"
      height="100vh"
      top={0}
      left={0}
      alignItems="center"
      justifyContent="center"
      $platform-web={{
        backdropFilter: hasWallet ? 'blur(24px)' : undefined,
        position: 'fixed',
      }}
      backgroundColor={hasWallet ? 'rgba(0, 0, 0, 0.6)' : undefined}
      zIndex={hasWallet ? '$overlay' : undefined}
      onPress={hasWallet ? () => navigate('/swap') : undefined}
    >
      <Flex
        width="80%"
        height="80%"
        backgroundColor="$surface1"
        borderRadius={48}
        alignItems="center"
        justifyContent="center"
        overflow="hidden"
        $platform-web={{
          boxShadow: '0px 32px 64px -15px rgba(18, 18, 23, 0.25)',
        }}
        onPress={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
        ref={containerRef}
      >
        {hasWallet ? (
          <iframe
            src={iframeUrl}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
            }}
            title="Uniswap Wrapped"
          />
        ) : (
          <DisconnectedState parentRef={containerRef} />
        )}
      </Flex>
    </Flex>
  )
}
