import { memo, useState } from 'react'
import { Flex, Loader, Text, TextProps, UniversalImage, useColorSchemeFromSeed, useSporeColors } from 'ui/src'
import { iconSizes, validColor, zIndexes } from 'ui/src/theme'
import { STATUS_RATIO } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isTestnetChain } from 'uniswap/src/features/chains/utils'
import { isMobileApp } from 'utilities/src/platform'

interface TokenLogoProps {
  url?: string | null
  symbol?: string
  name?: string | null
  chainId?: UniverseChainId | null
  size?: number
  hideNetworkLogo?: boolean
  networkLogoBorderWidth?: number
  loading?: boolean
  webFontSize?: number
  lineHeight?: TextProps['lineHeight']
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
  loading,
  webFontSize = 10,
  lineHeight = 14,
}: TokenLogoProps): JSX.Element {
  const isTestnetToken = !!chainId && isTestnetChain(chainId)

  // We want to avoid the extra render on mobile when updating the state, so we set this to `true` from the start.
  const [showBackground, setShowBackground] = useState(isMobileApp ? true : false)

  const colors = useSporeColors()
  const { foreground, background } = useColorSchemeFromSeed(name ?? symbol ?? '')

  const borderWidth = isTestnetToken ? size / TESTNET_BORDER_DIVISOR : 0

  const showNetworkLogo = !hideNetworkLogo && chainId && chainId !== UniverseChainId.Mainnet
  const networkLogoSize = Math.round(size * STATUS_RATIO)

  const borderOffset = isTestnetToken ? BORDER_OFFSET : 0

  const tokenSize = size - borderWidth - borderOffset

  if (loading) {
    return <Loader.Box borderRadius="$roundedFull" height={size} width={size} />
  }

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
          fontSize: webFontSize,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'clip',
        }}
        allowFontScaling={false}
        color={validColor(foreground)}
        fontFamily="$button"
        fontSize={17}
        fontWeight="500"
        lineHeight={lineHeight}
        minimumFontScale={0.5}
        numberOfLines={1}
      >
        {symbol?.slice(0, 3)}
      </Text>
    </Flex>
  )

  return (
    <Flex
      alignItems="center"
      height={size}
      justifyContent="center"
      testID="token-logo"
      pointerEvents="auto"
      width={size}
      position="relative"
    >
      {!isTestnetToken && (
        <Flex
          opacity={showBackground ? 1 : 0}
          height="96%"
          width="96%"
          zIndex={zIndexes.background}
          backgroundColor={colors.white.val}
          position="absolute"
          top="2%"
          left="2%"
          borderRadius={size / 2}
        />
      )}

      <UniversalImage
        allowLocalUri
        fallback={fallback}
        size={{ height: tokenSize, width: tokenSize }}
        style={{
          image: {
            borderRadius: size / 2,
            zIndex: zIndexes.default,
          },
        }}
        testID="token-image"
        uri={url ?? undefined}
        onLoad={() => setShowBackground(true)}
      />

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
        <Flex bottom={-2} position="absolute" right={-3} zIndex={zIndexes.mask}>
          <NetworkLogo borderWidth={networkLogoBorderWidth} chainId={chainId} size={networkLogoSize} />
        </Flex>
      )}
    </Flex>
  )
})
