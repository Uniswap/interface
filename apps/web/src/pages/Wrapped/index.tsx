import { DisconnectedState } from 'pages/Wrapped/DisconnectedState'
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { useAppDispatch } from 'state/hooks'
import { Flex, TouchableArea } from 'ui/src'
import { X } from 'ui/src/components/icons/X'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import { useSporeColorsForTheme } from 'ui/src/hooks/useSporeColors'
import { INTERFACE_NAV_HEIGHT, opacify } from 'ui/src/theme'
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
  const { fullWidth, fullHeight } = useDeviceDimensions()
  const isLandscape = fullWidth > fullHeight
  const darkColors = useSporeColorsForTheme('dark')

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
      height="100svh"
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
      overflow="hidden"
    >
      <Flex
        width="100%"
        height={hasWallet ? undefined : '80%'}
        maxHeight={`calc(100% - ${INTERFACE_NAV_HEIGHT}px)`}
        maxWidth={1200}
        aspectRatio={hasWallet ? (isLandscape ? '3/2' : '9/16') : undefined}
        backgroundColor="#361A37"
        borderRadius={48}
        alignItems="center"
        justifyContent="center"
        overflow="hidden"
        mt={hasWallet ? undefined : INTERFACE_NAV_HEIGHT}
        $platform-web={{
          boxShadow: '0px 32px 64px -15px rgba(18, 18, 23, 0.25)',
        }}
        $xxl={{
          width: hasWallet ? '100%' : 'calc(100% - 80px)',
        }}
        $md={{
          width: hasWallet ? '100%' : 'calc(100% - 48px)',
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
        <TouchableArea
          centered
          top="$spacing28"
          position="absolute"
          right="$spacing16"
          p="$spacing12"
          hoverStyle={{ backgroundColor: '#13131342' }}
          backgroundColor="#1313132E"
          borderRadius="$roundedFull"
          borderWidth={1}
          borderColor={opacify(0.12, darkColors.surface3.val)}
          backdropFilter="blur(20px)"
          zIndex="$overlay"
          $lg={{
            backgroundColor: '#13131342',
            p: '$spacing8',
          }}
          display={hasWallet ? 'flex' : 'none'}
          aria-label="Close Uniswap Wrapped"
          onPress={() => navigate('/swap')}
        >
          <X size="$icon.24" $lg={{ size: '$icon.20' }} color={darkColors.neutral1.val} />
        </TouchableArea>
      </Flex>
    </Flex>
  )
}
