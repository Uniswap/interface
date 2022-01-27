import { Currency } from '@uniswap/sdk-core'

// TODO: include chainId in currency Id
export function currencyId(currency: Currency): string {
  if (currency.isNative) return 'ETH'
  if (currency.isToken) return currency.address
  throw new Error('invalid currency')
}
