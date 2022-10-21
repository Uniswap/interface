import { ShadowProps } from '@shopify/restyle'
import { Currency } from '@uniswap/sdk-core'
import React, { useState } from 'react'
import { Image } from 'react-native'
import { SvgUri } from 'react-native-svg'
import { useAppTheme } from 'src/app/hooks'
import { NetworkLogo } from 'src/components/CurrencyLogo/NetworkLogo'
import { style } from 'src/components/CurrencyLogo/styles'
import { getCurrencyLogoSrcs } from 'src/components/CurrencyLogo/utils'
import { Box } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'
import { ChainId, CHAIN_ID_TO_LOGO } from 'src/constants/chains'
import { Theme } from 'src/styles/theme'
import { toSupportedChainId } from 'src/utils/chainId'
import { uriToHttp } from 'src/utils/uriToHttp'

const DEFAULT_SIZE = 36
const NETWORK_LOGO_SIZE = 16
const SHADOW_OFFSET: ShadowProps<Theme>['shadowOffset'] = { width: 0, height: 2 }
const THIN_BORDER = 0.5

interface CurrencyLogoProps {
  currency: Currency
  size?: number
}

export function CurrencyLogo(props: CurrencyLogoProps) {
  const { size, currency } = props
  const networkSize = NETWORK_LOGO_SIZE
  const notOnMainnet = currency.chainId !== ChainId.Mainnet
  const currencyLogoSize = size ?? DEFAULT_SIZE

  return (
    <Box alignItems="center" height={size} justifyContent="center" width={size}>
      <CurrencyLogoOnly currency={currency} size={currencyLogoSize} />
      {notOnMainnet && (
        <Box
          bottom={0}
          position="absolute"
          right={0}
          shadowColor="black"
          shadowOffset={SHADOW_OFFSET}
          shadowOpacity={0.1}
          shadowRadius={2}>
          <NetworkLogo chainId={currency.chainId} size={networkSize} />
        </Box>
      )}
    </Box>
  )
}

export function CurrencyLogoOnly({ currency, size = 40 }: CurrencyLogoProps) {
  const srcs: string[] = getCurrencyLogoSrcs(currency)

  const [imageError, setImageError] = useState(false)

  const onImageNotFound = () => {
    setImageError(true)
  }

  const theme = useAppTheme()

  if (currency?.isNative) {
    const chainId = toSupportedChainId(currency.chainId) ?? ChainId.Mainnet
    const logo = CHAIN_ID_TO_LOGO[chainId]
    return (
      <Image
        source={logo}
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
    )
  }

  // TODO(#95): Currently just uses the first URL in the source because unclear when we want to use a different one

  if (srcs.length > 0) {
    const src = srcs[0].toLowerCase()
    if (src.includes('.svg')) {
      return (
        <SvgUri
          height={size}
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
          uri={srcs[0]}
          width={size}
        />
      )
    }
    if (!imageError) {
      return (
        <Image
          source={srcs.map((uri) => {
            return {
              uri: uriToHttp(uri)[0],
            }
          })}
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
          bg="background3"
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

  return null
}
