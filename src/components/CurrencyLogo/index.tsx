import { Currency } from '@uniswap/sdk-core'
import React from 'react'
import { Image } from 'react-native'
import { SvgUri } from 'react-native-svg'
import { ETHEREUM_LOGO } from 'src/assets'
import { NetworkLogo } from 'src/components/CurrencyLogo/NetworkLogo'
import { style } from 'src/components/CurrencyLogo/styles'
import { getCurrencyLogoSrcs, maybeReplaceIPFSScheme } from 'src/components/CurrencyLogo/utils'
import { Box } from 'src/components/layout/Box'
import { ChainId } from 'src/constants/chains'

const DEFAULT_SIZE = 40

interface CurrencyLogoProps {
  currency: Currency
  size?: number
}

export function CurrencyLogo(props: CurrencyLogoProps) {
  const { size, currency } = props
  const currencyLogoSize = (size ?? DEFAULT_SIZE) - 4
  const networkSize = currencyLogoSize / 2.5
  return (
    <Box height={size} width={size}>
      <CurrencyLogoOnly size={currencyLogoSize} currency={currency} />
      {currency.chainId !== ChainId.MAINNET && (
        <Box position="absolute" bottom={0} right={0}>
          <NetworkLogo chainId={currency.chainId} size={networkSize} borderWidth={2} />
        </Box>
      )}
    </Box>
  )
}

function CurrencyLogoOnly({ currency, size = 40 }: CurrencyLogoProps) {
  const srcs: string[] = getCurrencyLogoSrcs(currency)

  if (currency?.isNative) {
    return (
      <Image
        style={[style.image, { width: size, height: size, borderRadius: size / 2 }]}
        source={ETHEREUM_LOGO}
      />
    )
  }

  // TODO(#95): Currently just uses the first URL in the source because unclear when we want to use a different one

  if (srcs.length > 0) {
    const src = srcs[0].toLowerCase()
    if (src.includes('.svg')) {
      return <SvgUri width={size} height={size} uri={srcs[0]} />
    }
    return (
      <Image
        style={[style.image, { width: size, height: size, borderRadius: size / 2 }]}
        source={srcs.map(maybeReplaceIPFSScheme)}
      />
    )
  }

  return null
}
