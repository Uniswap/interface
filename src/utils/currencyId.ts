import { Currency, Token } from '@swapr/sdk'

export function currencyId(currency: Currency): string {
  if (Currency.isNative(currency)) return currency.symbol || ''
  if (currency instanceof Token) return currency.address
  throw new Error('invalid currency')
}
