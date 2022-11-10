import { Currency } from '@uniswap/sdk-core'
import React, { useState } from 'react'
import { Image } from 'react-native'
import { SvgUri } from 'react-native-svg'
import { useAppTheme } from 'src/app/hooks'
import { NetworkLogo } from 'src/components/CurrencyLogo/NetworkLogo'
import { SHADOW_OFFSET, style, THIN_BORDER } from 'src/components/CurrencyLogo/styles'
import { getCurrencyLogoSrcs } from 'src/components/CurrencyLogo/utils'
import { Box } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'
import { ChainId, CHAIN_ID_TO_LOGO } from 'src/constants/chains'
import { iconSizes } from 'src/styles/sizing'
import { toSupportedChainId } from 'src/utils/chainId'
import { uriToHttp } from 'src/utils/uriToHttp'

interface CurrencyLogoProps {
  currency: NullUndefined<Currency>
  size?: number
}

interface CurrencyLogoOnlyProps extends CurrencyLogoProps {
  size: number
}

export function CurrencyLogo({ currency, size = iconSizes.xxxl }: CurrencyLogoProps) {
  const notOnMainnet = currency && currency.chainId !== ChainId.Mainnet

  return (
    <Box alignItems="center" height={size} justifyContent="center" width={size}>
      <CurrencyLogoOnly currency={currency} size={size} />
      {notOnMainnet && (
        <Box
          bottom={0}
          position="absolute"
          right={0}
          shadowColor="black"
          shadowOffset={SHADOW_OFFSET}
          shadowOpacity={0.1}
          shadowRadius={2}>
          <NetworkLogo chainId={currency.chainId} size={size * (2 / 5)} />
        </Box>
      )}
    </Box>
  )
}

export function CurrencyLogoOnly({ currency, size }: CurrencyLogoOnlyProps) {
  const [imageError, setImageError] = useState(false)
  const onImageNotFound = () => setImageError(true)
  const theme = useAppTheme()

  const srcs: string[] = getCurrencyLogoSrcs(currency)

  if (currency?.isNative) {
    const chainId = toSupportedChainId(currency.chainId) ?? ChainId.Mainnet
    const logo = CHAIN_ID_TO_LOGO[chainId]
    return (
      <Image
        source={logo}
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
    )
  }

  if (srcs.length === 0 || imageError) {
    return (
      <Box
        alignItems="center"
        bg="backgroundOutline"
        borderRadius="full"
        height={size}
        justifyContent="center"
        px="xs"
        width={size}>
        <Text adjustsFontSizeToFit color="textPrimary" numberOfLines={1} textAlign="center">
          {currency?.symbol?.slice(0, 3).toUpperCase() ?? ''}
        </Text>
      </Box>
    )
  }

  // TODO(#95): Currently just uses the first URL in the source because unclear when we want to use a different one
  const src = srcs[0].toLowerCase()
  if (src.includes('.svg')) {
    return (
      <SvgUri
        height={size}
        style={{
          backgroundColor: theme.colors.backgroundOutline,
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: theme.colors.backgroundOutline,
          borderWidth: THIN_BORDER,
        }}
        uri={srcs[0]}
        width={size}
      />
    )
  }

  return (
    <Image
      source={srcs.map((uri) => ({ uri: uriToHttp(uri)[0] }))}
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
      onError={onImageNotFound}
    />
  )
}
