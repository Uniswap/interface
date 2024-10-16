import { memo, useState } from 'react'
import { Flex, Text, UniversalImage, useColorSchemeFromSeed, useSporeColors } from 'ui/src'
import { iconSizes, validColor } from 'ui/src/theme'
import { STATUS_RATIO } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { isMobileApp } from 'utilities/src/platform'

interface TokenLogoProps {
  url?: string | null
  symbol?: string
  name?: string | null
  chainId?: UniverseChainId
  size?: number
  hideNetworkLogo?: boolean
  networkLogoBorderWidth?: number
}

const TESTNET_BORDER_DIVISOR = 15
const BORDER_OFFSET = 4

export const TokenLogo = memo(function _TokenLogo({
  url,
  symbol,
  name,
  chainId,
  size = iconSizes.icon40,
  hideNetworkLogo,
  networkLogoBorderWidth = isMobileApp ? 2 : 1.5,
}: TokenLogoProps): JSX.Element {
  const [showBackground, setShowBackground] = useState(false)

  const colors = useSporeColors()
  const { foreground, background } = useColorSchemeFromSeed(name ?? symbol ?? '')

  const isTestnetToken = UNIVERSE_CHAIN_INFO[chainId as UniverseChainId]?.testnet
  const borderWidth = isTestnetToken ? size / TESTNET_BORDER_DIVISOR : 0

  const showNetworkLogo = !hideNetworkLogo && chainId && chainId !== UniverseChainId.Mainnet
  const networkLogoSize = Math.round(size * STATUS_RATIO)

  const borderOffset = isTestnetToken ? BORDER_OFFSET : 0

  const tokenSize = size - borderWidth - borderOffset

  const fallback = (
    <Flex
      alignItems="center"
      borderRadius="$roundedFull"
      height={tokenSize}
      justifyContent="center"
      px="$spacing8"
      style={{ backgroundColor: background }}
      width={tokenSize}
    >
      <Text
        adjustsFontSizeToFit
        $platform-web={{
          // adjustFontSizeToFit is a react-native-only prop
          fontSize: 10,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'clip',
        }}
        allowFontScaling={false}
        color={validColor(foreground)}
        fontFamily="$button"
        fontSize={17}
        fontWeight="500"
        lineHeight={14}
        minimumFontScale={0.5}
        numberOfLines={1}
      >
        {symbol?.slice(0, 3)}
      </Text>
    </Flex>
  )

  const tokenImage = (
    <UniversalImage
      allowLocalUri
      fallback={fallback}
      size={{ height: tokenSize, width: tokenSize }}
      style={{
        image: {
          borderRadius: size / 2,
        },
      }}
      testID="token-image"
      uri={url ?? undefined}
      onLoad={() => setShowBackground(true)}
    />
  )

  return (
    <Flex
      alignItems="center"
      height={size}
      justifyContent="center"
      testID="token-logo"
      width={size}
      position="relative"
    >
      {isTestnetToken ? null : (
        <Flex
          opacity={showBackground ? 1 : 0}
          height="96%"
          width="96%"
          zIndex={-1}
          backgroundColor={colors.white.val}
          position="absolute"
          top="2%"
          left="2%"
          borderRadius={size / 2}
        />
      )}
      {tokenImage}
      {isTestnetToken && (
        <Flex
          borderRadius={size / 2}
          borderStyle="dashed"
          borderColor="$neutral3"
          borderWidth={borderWidth}
          height={size}
          width={size}
          style={{ boxSizing: 'border-box' }}
          position="absolute"
        />
      )}
      {showNetworkLogo && (
        <Flex bottom={-2} position="absolute" right={-3}>
          <NetworkLogo borderWidth={networkLogoBorderWidth} chainId={chainId} size={networkLogoSize} />
        </Flex>
      )}
    </Flex>
  )
})
