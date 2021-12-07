import { Currency } from '@uniswap/sdk-core'

// TODO: nit. consider renaming to currencyToKey
export function currencyId(currency: Currency): string {
  if (currency.isNative) return 'ETH'
  if (currency.isToken) return currency.address
  throw new Error('invalid currency')
}
