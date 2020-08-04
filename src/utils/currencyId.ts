import { Token } from '@uniswap/sdk'

export function currencyId(currency: Token): string {
  return currency.address
}
