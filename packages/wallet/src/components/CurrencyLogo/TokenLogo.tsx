import { memo } from 'react'
import { Image } from 'react-native'
import { Flex, Text, useIsDarkMode, useSporeColors } from 'ui/src'
import { iconSizes, spacing, validColor } from 'ui/src/theme'
import { useLogolessColorScheme } from 'ui/src/utils/colors'
import { isSVGUri, uriToHttp } from 'utilities/src/format/urls'
import { STATUS_RATIO } from 'wallet/src/components/CurrencyLogo/CurrencyLogo'
import { THIN_BORDER, style } from 'wallet/src/components/CurrencyLogo/styles'
import { ChainId } from 'wallet/src/constants/chains'
import { RemoteSvg } from 'wallet/src/features/images/RemoteSvg'
import { NetworkLogo } from './NetworkLogo'

interface TokenLogoProps {
  url?: string | null
  symbol?: string
  name?: string | null
  chainId?: ChainId
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

  const showNetworkLogo = !hideNetworkLogo && chainId && chainId !== ChainId.Mainnet
  const httpUri = url ? uriToHttp(url)[0] : null

  let tokenImage = null

  if (httpUri) {
    if (isSVGUri(httpUri)) {
      tokenImage = (
        <Flex borderRadius={size / 2} overflow="hidden">
          <RemoteSvg
            backgroundColor={colors.surface3.val}
            borderRadius={size / 2}
            height={size}
            imageHttpUrl={httpUri}
            width={size}
          />
        </Flex>
      )
    } else {
      tokenImage = (
        <Image
          source={{ uri: httpUri }}
          style={[
            style.image,
            {
              backgroundColor: colors.surface3.get(),
              width: size,
              height: size,
              borderRadius: size / 2,
              borderColor: colors.surface3.get(),
              borderWidth: THIN_BORDER,
            },
          ]}
        />
      )
    }
  }

  const isDarkMode = useIsDarkMode()
  const logolessColorScheme = useLogolessColorScheme(name ?? symbol ?? '')
  const { foreground, background } = isDarkMode
    ? logolessColorScheme.dark
    : logolessColorScheme.light

  return (
    <Flex alignItems="center" height={size} justifyContent="center" width={size}>
      {httpUri ? (
        tokenImage
      ) : (
        <Flex
          alignItems="center"
          borderRadius="$roundedFull"
          height={size}
          justifyContent="center"
          px="$spacing8"
          style={{ backgroundColor: background }}
          width={size}>
          <Text
            adjustsFontSizeToFit
            allowFontScaling={false}
            color={validColor(foreground)}
            fontFamily="$button"
            fontSize={17}
            fontWeight="500"
            lineHeight={14}
            minimumFontScale={0.5}
            numberOfLines={1}>
            {symbol?.slice(0, 3)}
          </Text>
        </Flex>
      )}
      {showNetworkLogo && (
        <Flex
          borderColor="$surface1"
          borderRadius={spacing.spacing8}
          borderWidth={networkLogoBorderWidth}
          bottom={-2}
          position="absolute"
          right={-3}>
          <NetworkLogo chainId={chainId} size={Math.round(size * STATUS_RATIO)} />
        </Flex>
      )}
    </Flex>
  )
})
