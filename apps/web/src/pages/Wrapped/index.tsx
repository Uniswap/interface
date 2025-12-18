import { DisconnectedState } from 'pages/Wrapped/DisconnectedState'
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { useAppDispatch } from 'state/hooks'
import { Flex, Text, TouchableArea } from 'ui/src'
import { X } from 'ui/src/components/icons/X'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import { useSporeColorsForTheme } from 'ui/src/hooks/useSporeColors'
import { INTERFACE_NAV_HEIGHT, opacify } from 'ui/src/theme'
import { WRAPPED_PATH } from 'uniswap/src/components/banners/shared/utils'
import { useUrlContext } from 'uniswap/src/contexts/UrlContext'
import { useActiveAddresses } from 'uniswap/src/features/accounts/store/hooks'
import { setHasDismissedUniswapWrapped2025Banner } from 'uniswap/src/features/behaviorHistory/slice'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { isAddress } from 'viem'

const MAX_CONTAINER_WIDTH = 1200
const MAX_CONTAINER_HEIGHT = `calc(100% - ${INTERFACE_NAV_HEIGHT}px)`
const CONTAINER_BACKGROUND_COLOR = '#361A37'

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
        backdropFilter: hasWallet ? 'blur(12px)' : undefined,
        position: 'fixed',
      }}
      backgroundColor={hasWallet ? 'rgba(0, 0, 0, 0.6)' : undefined}
      zIndex={hasWallet ? '$overlay' : undefined}
      overflow="hidden"
    >
      <Flex
        centered
        width="100%"
        maxWidth={MAX_CONTAINER_WIDTH}
        display={hasWallet ? 'flex' : 'none'}
        maxHeight={MAX_CONTAINER_HEIGHT}
      >
        <Trace logImpression={hasWallet} modal={ModalName.UniswapWrapped}>
          <Flex
            centered
            maxHeight={MAX_CONTAINER_HEIGHT}
            width={hasWallet ? '100%' : '85%'}
            aspectRatio={isLandscape ? '3/2' : '9/16'}
            backgroundColor={CONTAINER_BACKGROUND_COLOR}
            borderRadius="$rounded12"
            overflow="hidden"
            zIndex={hasWallet ? 2 : -1}
            opacity={hasWallet ? 1 : 0}
            animation="300msDelayed"
            animateOnly={['opacity', 'width']}
            $platform-web={{
              boxShadow: '0px 32px 64px -15px rgba(18, 18, 23, 0.25)',
            }}
            onPress={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
          >
            <iframe
              src={iframeUrl}
              style={{
                border: 'none',
                backgroundColor: 'transparent',
              }}
              width="100%"
              height="100%"
              title="Uniswap Wrapped"
            />
            <Trace logPress={true} element={ElementName.CloseButton}>
              <TouchableArea
                centered
                top="$spacing40"
                position="absolute"
                right="$spacing32"
                p="$spacing8"
                backgroundColor={opacify(12, darkColors.surface3.val)}
                borderRadius="$roundedFull"
                backdropFilter="blur(20px)"
                display={hasWallet ? 'flex' : 'none'}
                aria-label="Close Uniswap Wrapped"
                onPress={() => navigate('/swap')}
              >
                <Text
                  height="$spacing20"
                  color={opacify(50, darkColors.neutral1.val)}
                  hoverStyle={{ color: darkColors.neutral1.val }}
                >
                  <X size="$icon.20" color="inherit" />
                </Text>
              </TouchableArea>
            </Trace>
          </Flex>
        </Trace>
      </Flex>
      <Flex
        display={hasWallet ? 'none' : 'flex'}
        width="100%"
        height="80%"
        maxHeight={MAX_CONTAINER_HEIGHT}
        maxWidth={MAX_CONTAINER_WIDTH}
        backgroundColor={CONTAINER_BACKGROUND_COLOR}
        borderRadius={hasWallet ? '$rounded12' : 48}
        alignItems="center"
        justifyContent="center"
        overflow="hidden"
        mt={INTERFACE_NAV_HEIGHT}
        zIndex={hasWallet ? -1 : 1}
        $platform-web={{
          boxShadow: '0px 32px 64px -15px rgba(18, 18, 23, 0.25)',
        }}
        $xxl={{
          width: 'calc(100% - 80px)',
        }}
        $md={{
          width: 'calc(100% - 48px)',
        }}
        onPress={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
        ref={containerRef}
      >
        <Trace logImpression={!hasWallet} modal={ModalName.UniswapWrappedDisconnected}>
          <DisconnectedState parentRef={containerRef} />
        </Trace>
      </Flex>
    </Flex>
  )
}
