import { ShadowProps } from '@shopify/restyle'
import React from 'react'
import { Image } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import { NetworkLogo } from 'src/components/CurrencyLogo/NetworkLogo'
import { style } from 'src/components/CurrencyLogo/styles'
import { Box } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { theme as FixedTheme, Theme } from 'src/styles/theme'

const SHADOW_OFFSET: ShadowProps<Theme>['shadowOffset'] = { width: 0, height: 2 }
const THIN_BORDER = 0.5

interface TokenLogoProps {
  url?: string
  symbol?: string
  chainId?: ChainId
  size?: number
}

export function TokenLogo({
  url,
  symbol,
  chainId,
  size = FixedTheme.imageSizes.xl,
}: TokenLogoProps) {
  const theme = useAppTheme()
  const showNetworkLogo = chainId && chainId !== ChainId.Mainnet

  return (
    <Box alignItems="center" height={size} justifyContent="center" width={size}>
      {url ? (
        <Image
          source={{ uri: url }}
          style={[
            style.image,
            {
              backgroundColor: theme.colors.textTertiary,
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
          bg="background3"
          height={size}
          justifyContent="center"
          px="xxs"
          style={{ borderRadius: size / 2 }}
          width={size}>
          <Text adjustsFontSizeToFit color="textSecondary" numberOfLines={1} textAlign="center">
            {symbol?.slice(0, 5).toUpperCase()}
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
          <NetworkLogo chainId={chainId} size={theme.iconSizes.sm} />
        </Box>
      )}
    </Box>
  )
}
