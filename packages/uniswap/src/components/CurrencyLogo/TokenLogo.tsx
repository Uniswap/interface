import { memo } from 'react'
import { Flex, Text, UniversalImage, useIsDarkMode, useSporeColors } from 'ui/src'
import { iconSizes, spacing, validColor } from 'ui/src/theme'
import { useLogolessColorScheme } from 'ui/src/utils/colors'
import { STATUS_RATIO } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { UniverseChainId } from 'uniswap/src/types/chains'

interface TokenLogoProps {
  url?: string | null
  symbol?: string
  name?: string | null
  chainId?: UniverseChainId
  size?: number
  hideNetworkLogo?: boolean
  networkLogoBorderWidth?: number
}

export const TokenLogo = memo(function _TokenLogo({
  url,
  symbol,
  name,
  chainId,
  size = iconSizes.icon40,
  hideNetworkLogo,
  networkLogoBorderWidth = spacing.spacing2,
}: TokenLogoProps): JSX.Element {
  const colors = useSporeColors()
  const isDarkMode = useIsDarkMode()
  const logolessColorScheme = useLogolessColorScheme(name ?? symbol ?? '')

  const showNetworkLogo = !hideNetworkLogo && chainId && chainId !== UniverseChainId.Mainnet

  const { foreground, background } = isDarkMode ? logolessColorScheme.dark : logolessColorScheme.light
  const fallback = (
    <Flex
      alignItems="center"
      borderRadius="$roundedFull"
      height={size}
      justifyContent="center"
      px="$spacing8"
      style={{ backgroundColor: background }}
      width={size}
    >
      <Text
        adjustsFontSizeToFit
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
      fallback={fallback}
      size={{ height: size, width: size }}
      style={{
        image: {
          backgroundColor: colors.surface3.val,
          borderRadius: size / 2,
        },
      }}
      testID="token-image"
      uri={url ?? undefined}
    />
  )

  return (
    <Flex alignItems="center" height={size} justifyContent="center" testID="token-logo" width={size}>
      {tokenImage}
      {showNetworkLogo && (
        <Flex
          borderColor="$surface1"
          borderRadius={spacing.spacing8}
          borderWidth={networkLogoBorderWidth}
          bottom={-2}
          position="absolute"
          right={-3}
        >
          <NetworkLogo chainId={chainId} size={Math.round(size * STATUS_RATIO)} />
        </Flex>
      )}
    </Flex>
  )
})
