import { ChainId, Currency, Token, WETH } from '@kyberswap/ks-sdk-core'

import { NativeCurrencies } from 'constants/tokens'

export function currencyId(currency?: Currency, chainId?: ChainId): string {
  if (currency?.isNative && !!chainId) return NativeCurrencies[chainId].symbol as string
  if (currency instanceof Token) return currency.address
  return ''
}

export function currencyIdFromAddress(address: string, chainId?: ChainId): string {
  if (chainId && WETH[chainId].address === address.toLowerCase()) return WETH[chainId].name || address
  return address
}
