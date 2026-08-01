import { isMobileApp } from '@universe/environment'
import { memo, useState } from 'react'
import {
  Flex,
  FlexProps,
  Loader,
  styled,
  Text,
  TextProps,
  UniversalImage,
  UniversalImageResizeMode,
  useColorSchemeFromSeed,
  useSporeColors,
} from 'ui/src'
import { iconSizes, validColor, zIndexes } from 'ui/src/theme'
import { getBadgeBorderRadius, getBadgeOuterSize } from 'uniswap/src/components/CurrencyLogo/badgeSizeUtils'
import { STATUS_RATIO } from 'uniswap/src/components/CurrencyLogo/constants'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isTestnetChain } from 'uniswap/src/features/chains/utils'

interface TokenLogoProps {
  url?: string | null
  symbol?: string
  name?: string | null
  chainId?: UniverseChainId | null
  size?: number
  hideNetworkLogo?: boolean
  alwaysShowNetworkLogo?: boolean
  networkCount?: number
  networkLogoBorderWidth?: number
  loading?: boolean
  webFontSize?: number
  lineHeight?: TextProps['lineHeight']
  transition?: FlexProps['transition']
  /** Controls how the image fills the circular logo. Defaults to Cover so non-square images are cropped to the circle. */
  imageResizeMode?: UniversalImageResizeMode
}

const Badge = styled(Flex, {
  bottom: -2,
  position: 'absolute',
  right: -3,
  zIndex: zIndexes.mask,
})

const TESTNET_BORDER_DIVISOR = 15
const BORDER_OFFSET = 4

/** Gray circular badge showing network count; same size and shape as NetworkLogo for consistency. */
function MultichainCountBadge({
  count,
  sizeWithoutBorder,
  borderWidth,
}: {
  count: number
  sizeWithoutBorder: number
  borderWidth: number
}): JSX.Element {
  const colors = useSporeColors()
  const outerSize = getBadgeOuterSize(sizeWithoutBorder, borderWidth)
  const borderRadius = getBadgeBorderRadius(outerSize, 'square')

  return (
    <Badge>
      <Flex
        centered
        width={outerSize}
        height={outerSize}
        borderRadius={borderRadius}
        backgroundColor="$surface3Solid"
        borderWidth={borderWidth}
        borderColor={colors.surface1.val}
        testID="multichain-count-badge"
      >
        <Text
          allowFontScaling={false}
          color="$neutral1"
          variant="buttonLabel4"
          $platform-web={{ fontSize: 10, lineHeight: 12 }}
          numberOfLines={1}
        >
          {count > 99 ? '99+' : String(count)}
        </Text>
      </Flex>
    </Badge>
  )
}

function NetworkLogoBadge({
  chainId,
  size,
  borderWidth,
}: {
  chainId: UniverseChainId | null
  size: number
  borderWidth: number
}): JSX.Element {
  return (
    <Badge>
      <NetworkLogo borderWidth={borderWidth} chainId={chainId} size={size} />
    </Badge>
  )
}

/** Exported for unit tests. */
export function shouldShowNetworkLogo({
  chainId,
  alwaysShowNetworkLogo,
  hideNetworkLogo,
  showMainnetNetworkLogo,
}: {
  chainId: UniverseChainId | null | undefined
  alwaysShowNetworkLogo: boolean | undefined
  hideNetworkLogo: boolean | undefined
  showMainnetNetworkLogo: boolean
}): boolean {
  if (alwaysShowNetworkLogo && chainId) {
    return true
  }
  if (!hideNetworkLogo && !!chainId) {
    // Historically we hid the Ethereum badge on mainnet; with multichain UX we show it for clarity.
    return chainId !== UniverseChainId.Mainnet || showMainnetNetworkLogo
  }
  return false
}

export const TokenLogo = memo(function TokenLogoInner({
  url,
  symbol,
  name,
  chainId,
  size = iconSizes.icon40,
  hideNetworkLogo,
  alwaysShowNetworkLogo,
  networkCount,
  networkLogoBorderWidth = isMobileApp ? 2 : 1.5,
  loading,
  webFontSize = 10,
  lineHeight = 14,
  transition,
  imageResizeMode = UniversalImageResizeMode.Cover,
}: TokenLogoProps): JSX.Element {
  const isTestnetToken = !!chainId && isTestnetChain(chainId)

  // We want to avoid the extra render on mobile when updating the state, so we set this to `true` from the start.
  const [showBackground, setShowBackground] = useState(isMobileApp ? true : false)

  const colors = useSporeColors()
  const { foreground, background } = useColorSchemeFromSeed(name ?? symbol ?? '')

  const borderWidth = isTestnetToken ? size / TESTNET_BORDER_DIVISOR : 0

  const showMultichainCountBadge = networkCount !== undefined && networkCount > 1
  const showNetworkLogo = shouldShowNetworkLogo({
    alwaysShowNetworkLogo,
    hideNetworkLogo,
    chainId,
    showMainnetNetworkLogo: true,
  })
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
      transition={transition}
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
          borderRadius="$roundedFull"
          transition={transition}
        />
      )}

      <UniversalImage
        allowLocalUri
        fallback={fallback}
        size={{ height: tokenSize, width: tokenSize, resizeMode: imageResizeMode }}
        style={{
          image: {
            // High value auto-maps to max, preventing CSS animation issues
            borderRadius: size,
            zIndex: zIndexes.default,
            ...(transition && { transition }),
          },
        }}
        testID="token-image"
        uri={url ?? undefined}
        onLoad={() => setShowBackground(true)}
      />

      {isTestnetToken && (
        <Flex
          borderRadius="$roundedFull"
          borderStyle="dashed"
          borderColor="$neutral3"
          borderWidth={borderWidth}
          height={size}
          width={size}
          style={{ boxSizing: 'border-box' }}
          position="absolute"
          transition={transition}
        />
      )}

      {showMultichainCountBadge ? (
        <MultichainCountBadge
          count={networkCount}
          sizeWithoutBorder={networkLogoSize}
          borderWidth={networkLogoBorderWidth}
        />
      ) : (
        showNetworkLogo && (
          <NetworkLogoBadge borderWidth={networkLogoBorderWidth} chainId={chainId ?? null} size={networkLogoSize} />
        )
      )}
    </Flex>
  )
})
