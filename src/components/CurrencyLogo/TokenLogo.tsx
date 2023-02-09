import React from 'react'
import { Image } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import { NetworkLogo } from 'src/components/CurrencyLogo/NetworkLogo'
import { SHADOW_OFFSET, style, THIN_BORDER } from 'src/components/CurrencyLogo/styles'
import { Box } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { iconSizes } from 'src/styles/sizing'

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
  const theme = useAppTheme()
  const showNetworkLogo = !hideNetworkLogo && chainId && chainId !== ChainId.Mainnet

  return (
    <Box alignItems="center" height={size} justifyContent="center" width={size}>
      {url ? (
        <Image
          source={{ uri: url }}
          style={[
            style.image,
            {
              backgroundColor: theme.colors.backgroundOutline,
              width: size,
              height: size,
              borderRadius: size / 2,
              borderColor: theme.colors.backgroundOutline,
              borderWidth: THIN_BORDER,
            },
          ]}
        />
      ) : (
        <Box
          alignItems="center"
          bg="backgroundOutline"
          borderRadius="roundedFull"
          height={size}
          justifyContent="center"
          px="spacing8"
          width={size}>
          <Text adjustsFontSizeToFit color="textPrimary" numberOfLines={1} textAlign="center">
            {symbol?.slice(0, 3).toUpperCase()}
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
          <NetworkLogo chainId={chainId} size={size * (2 / 5)} />
        </Box>
      )}
    </Box>
  )
}
