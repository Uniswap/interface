import { Currency } from '@uniswap/sdk-core'
import React from 'react'
import { CurrencyLogoOnly } from 'src/components/CurrencyLogo'
import { NFTViewer } from 'src/components/images/NFTViewer'
import { Box } from 'src/components/layout'

export function CurrencyLogoOrPlaceholder({
  currency,
  size,
}: {
  currency: NullUndefined<Currency>
  size: number
}) {
  if (!currency) {
    return <Box backgroundColor="background2" borderRadius="full" height={size} width={size} />
  }

  return <CurrencyLogoOnly currency={currency} size={size} />
}

export function NFTLogoOrPlaceholder(props: { nftImageUrl?: string; size: number }) {
  const { nftImageUrl, size } = props
  return (
    <Box
      alignItems="center"
      backgroundColor="background2"
      borderRadius="xs"
      height={size}
      justifyContent="center"
      overflow="hidden"
      width={size}>
      {nftImageUrl && <NFTViewer uri={nftImageUrl} />}
    </Box>
  )
}
