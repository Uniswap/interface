import { Currency } from '@uniswap/sdk-core'

export function currencyId(currency: Currency): string {
  if (currency.isEther) return 'ETH'
  if (currency.isToken) return currency.address
  throw new Error('invalid currency')
}
