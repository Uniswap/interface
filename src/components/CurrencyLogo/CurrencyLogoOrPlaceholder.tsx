import { Currency } from '@uniswap/sdk-core'
import React from 'react'
import { CurrencyLogoOnly } from 'src/components/CurrencyLogo'
import { Box } from 'src/components/layout'

export function CurrencyLogoOrPlaceholder(props: { currency: Nullable<Currency>; size: number }) {
  const { currency, size } = props
  if (!currency) {
    return (
      <Box backgroundColor="backgroundContainer" borderRadius="full" height={size} width={size} />
    )
  }

  return <CurrencyLogoOnly currency={currency} size={size} />
}
