import { Currency } from '@uniswap/sdk-core'

export function currencyId(currency: Currency | undefined): string {
  if (currency?.isNative) return 'ETH'
  if (currency?.isToken) return currency.address
  throw new Error('invalid currency')
}
