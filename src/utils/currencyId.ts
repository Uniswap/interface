import { Currency } from '@uniswap/sdk-core'
import { NATIVE_ADDRESS } from 'src/constants/addresses'

export function currencyId(currency: Currency): string {
  const chainId = currency.chainId
  return `${chainId}-${currencyAddress(currency)}`
}

export function currencyAddress(currency: Currency): string {
  if (currency.isNative) return NATIVE_ADDRESS
  if (currency.isToken) return currency.address
  throw new Error('invalid currency')
}
