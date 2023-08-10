import { Image } from 'react-native'
import { useTheme } from 'tamagui'
import { Box } from 'ui/src/components/layout'
import { Text } from 'ui/src/components/text/Text'
import { iconSizes } from 'ui/src/theme/iconSizes'
import { isSVGUri, uriToHttp } from 'utilities/src/format/urls'
import { STATUS_RATIO } from 'wallet/src/components/CurrencyLogo/CurrencyLogo'
import { SHADOW_OFFSET, style, THIN_BORDER } from 'wallet/src/components/CurrencyLogo/styles'
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

export function TokenLogo({
  url,
  symbol,
  chainId,
  size = iconSizes.icon40,
  hideNetworkLogo,
}: TokenLogoProps): JSX.Element {
  const theme = useTheme()
  const showNetworkLogo = !hideNetworkLogo && chainId && chainId !== ChainId.Mainnet
  const httpUri = url ? uriToHttp(url)[0] : null

  let tokenImage = null

  if (httpUri) {
    if (isSVGUri(httpUri)) {
      tokenImage = (
        <Box borderRadius={size / 2} overflow="hidden">
          <RemoteSvg
            backgroundColor={theme.DEP_backgroundOutline.get()}
            borderRadius={size / 2}
            height={size}
            imageHttpUrl={httpUri}
            width={size}
          />
        </Box>
      )
    } else {
      tokenImage = (
        <Image
          source={{ uri: httpUri }}
          style={[
            style.image,
            {
              backgroundColor: theme.DEP_backgroundOutline.get(),
              width: size,
              height: size,
              borderRadius: size / 2,
              borderColor: theme.DEP_backgroundOutline.get(),
              borderWidth: THIN_BORDER,
            },
          ]}
        />
      )
    }
  }

  return (
    <Box alignItems="center" height={size} justifyContent="center" width={size}>
      {httpUri ? (
        tokenImage
      ) : (
        <Box
          alignItems="center"
          bg="$DEP_backgroundOutline"
          borderRadius="$roundedFull"
          height={size}
          justifyContent="center"
          px="$spacing8"
          width={size}>
          <Text
            adjustsFontSizeToFit
            color="$DEP_textPrimary"
            flex={0}
            numberOfLines={1}
            textAlign="center">
            {symbol?.slice(0, 3)}
          </Text>
        </Box>
      )}
      {showNetworkLogo && (
        <Box
          bottom={0}
          position="absolute"
          right={0}
          shadowColor="black"
          shadowOffset={SHADOW_OFFSET}
          shadowOpacity={0.1}
          shadowRadius={2}>
          <NetworkLogo chainId={chainId} size={size * STATUS_RATIO} />
        </Box>
      )}
    </Box>
  )
}
