import { ShadowProps } from '@shopify/restyle'
import React, { useState } from 'react'
import { Image } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import { NetworkLogo } from 'src/components/CurrencyLogo/NetworkLogo'
import { style } from 'src/components/CurrencyLogo/styles'
import { Box } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { CurrencyInfo } from 'src/features/dataApi/types'
import { Theme } from 'src/styles/theme'

const DEFAULT_SIZE = 36
const NETWORK_LOGO_SIZE = 16
const SHADOW_OFFSET: ShadowProps<Theme>['shadowOffset'] = { width: 0, height: 2 }
const THIN_BORDER = 0.5

interface CurrencyInfoLogoProps {
  currencyInfo: CurrencyInfo
  size?: number
}

export function CurrencyInfoLogo({ currencyInfo, size = DEFAULT_SIZE }: CurrencyInfoLogoProps) {
  const { currency } = currencyInfo
  const notOnMainnet = currency.chainId !== ChainId.Mainnet

  return (
    <Box alignItems="center" height={size} justifyContent="center" width={size}>
      <CurrencyInfoLogoOnly currencyInfo={currencyInfo} size={size} />
      {notOnMainnet && (
        <Box
          bottom={0}
          position="absolute"
          right={0}
          shadowColor="black"
          shadowOffset={SHADOW_OFFSET}
          shadowOpacity={0.1}
          shadowRadius={2}>
          <NetworkLogo chainId={currency.chainId} size={NETWORK_LOGO_SIZE} />
        </Box>
      )}
    </Box>
  )
}

export function CurrencyInfoLogoOnly({ currencyInfo, size = 40 }: CurrencyInfoLogoProps) {
  const { logoUrl, currency } = currencyInfo

  const [imageError, setImageError] = useState(false)

  const onImageNotFound = () => {
    setImageError(true)
  }

  const theme = useAppTheme()

  if (logoUrl && !imageError) {
    return (
      <Image
        source={{ uri: logoUrl }}
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
        onError={() => onImageNotFound()}
      />
    )
  } else {
    return (
      <Box
        alignItems="center"
        bg="backgroundAction"
        height={size}
        justifyContent="center"
        px="xxs"
        style={{ borderRadius: size / 2 }}
        width={size}>
        <Text adjustsFontSizeToFit color="textSecondary" numberOfLines={1} textAlign="center">
          {currency.symbol?.slice(0, 5).toUpperCase()}
        </Text>
      </Box>
    )
  }
}
