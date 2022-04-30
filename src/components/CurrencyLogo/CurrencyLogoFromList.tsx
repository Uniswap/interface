import React from 'react'
import { useTokenInfoFromActiveList } from 'hooks/useTokenInfoFromActiveList'
import CurrencyLogo, { CurrencyLogoProps } from './index'

/** helper component to retrieve a base currency from the active token lists */
export function CurrencyLogoFromList({ currency, ...rest }: CurrencyLogoProps) {
  const token = useTokenInfoFromActiveList(currency)

  return <CurrencyLogo currency={token} {...rest} />
}
