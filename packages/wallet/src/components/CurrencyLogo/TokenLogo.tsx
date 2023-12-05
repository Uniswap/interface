import { memo } from 'react'
import { Image } from 'react-native'
import { Flex, Text, useSporeColors } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { isSVGUri, uriToHttp } from 'utilities/src/format/urls'
import { STATUS_RATIO } from 'wallet/src/components/CurrencyLogo/CurrencyLogo'
import { style, THIN_BORDER } from 'wallet/src/components/CurrencyLogo/styles'
import { ChainId } from 'wallet/src/constants/chains'
import { RemoteSvg } from 'wallet/src/features/images/RemoteSvg'
import { NetworkLogo } from './NetworkLogo'

interface TokenLogoProps {
  url?: string | null
  symbol?: string
  chainId?: ChainId
  size?: number
  hideNetworkLogo?: boolean
}

export const TokenLogo = memo(function _TokenLogo({
  url,
  symbol,
  chainId,
  size = iconSizes.icon40,
  hideNetworkLogo,
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

  return (
    <Flex alignItems="center" height={size} justifyContent="center" width={size}>
      {httpUri ? (
        tokenImage
      ) : (
        <Flex
          alignItems="center"
          bg="$surface3"
          borderRadius="$roundedFull"
          height={size}
          justifyContent="center"
          px="$spacing8"
          width={size}>
          <Text
            adjustsFontSizeToFit
            color="$neutral1"
            lineHeight={size * 0.5}
            minimumFontScale={0.5}
            numberOfLines={1}
            textAlign="center">
            {symbol?.slice(0, 3)}
          </Text>
        </Flex>
      )}
      {showNetworkLogo && (
        <Flex
          borderColor="$surface1"
          borderRadius={8}
          borderWidth={2}
          bottom={-2}
          position="absolute"
          right={-3}>
          <NetworkLogo chainId={chainId} size={size * STATUS_RATIO} />
        </Flex>
      )}
    </Flex>
  )
})
