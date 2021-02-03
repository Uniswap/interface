import { Token } from '@ubeswap/sdk'

export function currencyId(currency: Token): string {
  return currency.address
}
