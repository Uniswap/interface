import { Currency } from '@uniswap/sdk-core'
import React from 'react'
import { Image, StyleSheet } from 'react-native'
import { SvgUri } from 'react-native-svg'
import { ETHEREUM_LOGO } from 'src/assets'
import { getCurrencyLogoSrcs } from 'src/components/CurrencyLogo/utils'

export const getTokenLogoURL = (address: string) =>
  `https://raw.githubusercontent.com/uniswap/assets/master/blockchains/ethereum/assets/${address}/logo.png`

interface CurrencyLogoProps {
  currency: Currency
  size?: number
}

export function CurrencyLogo({ currency, size = 40 }: CurrencyLogoProps) {
  const srcs: string[] = getCurrencyLogoSrcs(currency)

  if (currency?.isNative) {
    return (
      <Image
        style={{ ...style.image, width: size, height: size, borderRadius: size / 2 }}
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
        style={{ width: size, height: size, borderRadius: size / 2 }}
        source={srcs.map(maybeReplaceIPFSScheme)}
      />
    )
  }

  return null
}

function maybeReplaceIPFSScheme(uri: string) {
  return {
    uri: uri.includes('ipfs://')
      ? `https://cloudflare-ipfs.com/ipfs/${uri.replace('ipfs://', '')}`
      : uri,
  }
}

const style = StyleSheet.create({
  image: { resizeMode: 'cover' },
})
